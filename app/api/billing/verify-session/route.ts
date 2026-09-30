import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { activatePaidTier } from '@/lib/billing';

/**
 * POST /api/billing/verify-session
 * Called by the dashboard when the user returns from Stripe Checkout
 * (?checkout=success&session_id=...). Retrieves the session server-side
 * from Stripe (trusted), and if paid, activates the paid tier on the
 * signed-in user's Profile. This makes the flow work on localhost where
 * Stripe webhooks cannot reach the machine.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId: string | undefined = body.sessionId;
    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'Valid sessionId required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ error: 'Checkout session not completed', status: session.payment_status }, { status: 400 });
    }

    const tier = session.metadata?.tier === 'ENTERPRISE' ? 'ENTERPRISE' : 'PRO';
    // Trust the session's own client_reference_id if it maps to the signed-in
    // user's checkout; otherwise fall back to the Clerk user.
    const profileUserId = session.client_reference_id || userId;
    const email = session.customer_details?.email || null;

    const result = await activatePaidTier({
      userId: profileUserId,
      email,
      customerId: typeof session.customer === 'string' ? session.customer : null,
      subscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
      tier,
    });

    return NextResponse.json({
      success: true,
      planTier: result.planTier,
      generatedKey: result.generatedKey,
    });
  } catch (error: any) {
    console.error('[Stripe Billing] Session verification failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify checkout session' },
      { status: 500 }
    );
  }
}
