import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { activatePaidTier, TIER_LIMITS } from '@/lib/billing';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set — running in demo mode.');
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle Event Types via Prisma
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id || session.metadata?.userId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const tier = session.metadata?.tier === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO';

      console.log(`[Stripe Webhook] Checkout completed for User: ${userId}, Customer: ${customerId}`);

      if (userId) {
        // Idempotent: upgrades Profile to the paid tier and provisions the
        // tier's live API key (skipped if the verify-session path already did).
        const result = await activatePaidTier({
          userId,
          email: session.customer_details?.email || null,
          customerId,
          subscriptionId,
          tier,
        });
        console.log(
          `[Stripe Webhook] Tier ${result.planTier} active for ${userId}${result.generatedKey ? ', new API key provisioned' : ' (key already provisioned)'}`
        );
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      console.log(`[Stripe Webhook] Subscription deleted for Customer: ${customerId}`);

      const profile = await prisma.profile.findUnique({
        where: { stripeCustomerId: customerId },
      });

      if (profile) {
        // Revert profile to FREE tier
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            planTier: PlanTier.FREE,
            subscriptionStatus: SubscriptionStatus.CANCELED,
          },
        });

        // Downgrade active API key limits to 100
        await prisma.apiKey.updateMany({
          where: { userId: profile.id },
          data: { monthlyLimit: 100 },
        });
      }
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
