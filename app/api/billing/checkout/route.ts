import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createDemoCheckoutSession } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const { priceId, tier } = body;

    // Attach the real (Clerk) user identity so the post-payment flow can
    // activate the correct Profile. Guests fall back to a demo profile.
    const { userId } = await auth();
    const targetUserId = userId || '00000000-0000-0000-0000-000000000001';
    const resolvedTier = tier === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO';

    function resolvePriceId(t?: string, pid?: string): string | null {
      if (t === 'ENTERPRISE') return process.env.STRIPE_ENTERPRISE_PRICE_ID || null;
      if (t === 'PRO') return process.env.STRIPE_PRO_PRICE_ID || null;
      if (pid && pid.startsWith('price_1')) return pid;
      return process.env.STRIPE_PRO_PRICE_ID || null;
    }

    const targetPriceId = resolvePriceId(resolvedTier, priceId);

    if (!targetPriceId) {
      return NextResponse.json(
        { error: 'No Stripe Price ID configured for this tier. Set STRIPE_PRO_PRICE_ID / STRIPE_ENTERPRISE_PRICE_ID in .env.' },
        { status: 500 }
      );
    }

    const checkoutUrl = await createDemoCheckoutSession(targetUserId, targetPriceId, resolvedTier);

    return NextResponse.json({
      url: checkoutUrl,
      status: 200,
    });
  } catch (error: any) {
    console.error('[Stripe Billing] Checkout session creation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
