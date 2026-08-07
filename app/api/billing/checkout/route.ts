import { NextResponse } from 'next/server';
import { createDemoCheckoutSession } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const { priceId, userId } = body;

    const targetUserId = userId || '00000000-0000-0000-0000-000000000001';
    const targetPriceId = priceId || process.env.STRIPE_PRO_PRICE_ID || 'price_test_demo_pro_tier';

    const checkoutUrl = await createDemoCheckoutSession(targetUserId, targetPriceId);

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
