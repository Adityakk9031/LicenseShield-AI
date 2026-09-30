import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_secret_key_12345';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
});

/**
 * Creates a Stripe Test Checkout Session for demo subscription upgrades.
 *
 * @param userId Clerk User ID (Profile ID)
 * @param priceId Stripe Test Price ID (e.g. Pro or Enterprise plan)
 * @param tier Plan tier stored in session metadata for post-payment activation
 * @returns Checkout session URL for redirection
 */
export async function createDemoCheckoutSession(
  userId: string,
  priceId: string,
  tier: 'PRO' | 'ENTERPRISE' = 'PRO'
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    client_reference_id: userId,
    metadata: {
      userId,
      tier,
    },
    success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing?checkout=cancel`,
  });

  if (!session.url) {
    throw new Error('Failed to generate Stripe Checkout URL.');
  }

  return session.url;
}
