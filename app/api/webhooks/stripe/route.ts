import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/payment';
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

      console.log(`[Stripe Webhook] Checkout completed for User: ${userId}, Customer: ${customerId}`);

      if (userId) {
        // 1. Upsert Profile record via Prisma to PRO tier
        await prisma.profile.upsert({
          where: { id: userId },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            planTier: PlanTier.PRO,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
          },
          create: {
            id: userId,
            email: session.customer_details?.email || 'developer@company.com',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            planTier: PlanTier.PRO,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
          },
        });

        // 2. Generate a new live API Key (ls_live_...) and store via Prisma
        const rawSecret = crypto.randomBytes(16).toString('hex');
        const rawApiKey = `ls_live_${rawSecret}`;
        const keyHash = hashApiKey(rawApiKey);
        const keyPrefix = rawApiKey.slice(0, 12);

        await prisma.apiKey.create({
          data: {
            userId,
            keyHash,
            keyPrefix,
            name: 'Pro Subscription Live Key',
            monthlyLimit: 10000,
            usageCount: 0,
            isActive: true,
          },
        });

        console.log(`[Stripe Webhook] Created new Pro API Key (${keyPrefix}...) for User ${userId}`);
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
