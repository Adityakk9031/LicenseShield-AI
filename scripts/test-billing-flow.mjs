// One-off end-to-end test of the post-payment billing flow:
// 1. Create a real Stripe checkout session via the local API
// 2. Simulate Stripe's signed `checkout.session.completed` webhook
// 3. Verify the Profile tier + provisioned API key in the database
import crypto from 'node:crypto';

const BASE = 'http://localhost:3001';
const WHSEC = process.env.STRIPE_WEBHOOK_SECRET;

async function main() {
  // Step 1: create checkout session
  const checkoutRes = await fetch(`${BASE}/api/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: 'PRO' }),
  });
  const checkout = await checkoutRes.json();
  if (!checkout.url) throw new Error(`Checkout failed: ${JSON.stringify(checkout)}`);
  const sessionId = new URL(checkout.url).searchParams.get('session_id');
  console.log(`1. Checkout session created: ${sessionId}`);

  // Step 2: signed webhook event (HMAC-SHA256 of `${t}.${payload}` with the whsec)
  const event = {
    id: `evt_test_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        client_reference_id: '00000000-0000-0000-0000-000000000001',
        customer: 'cus_test_billing_flow',
        subscription: 'sub_test_billing_flow',
        customer_details: { email: 'billing-test@example.com' },
        metadata: { userId: '00000000-0000-0000-0000-000000000001', tier: 'PRO' },
      },
    },
  };
  const payload = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', WHSEC).update(`${t}.${payload}`).digest('hex');

  const hookRes = await fetch(`${BASE}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': `t=${t},v1=${sig}` },
    body: payload,
  });
  console.log(`2. Webhook response: ${hookRes.status} ${await hookRes.text()}`);

  // Step 3: verify DB state
  const { default: Prisma } = await import('@prisma/client');
  const prisma = new Prisma.PrismaClient();
  const profile = await prisma.profile.findUnique({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    include: { apiKeys: true },
  });
  await prisma.$disconnect();
  console.log('3. DB state:');
  console.log(`   planTier=${profile?.planTier} status=${profile?.subscriptionStatus} stripeSub=${profile?.stripeSubscriptionId}`);
  console.log(`   apiKeys: ${profile?.apiKeys.map((k) => `${k.keyPrefix}... limit=${k.monthlyLimit} active=${k.isActive}`).join(' | ') || 'NONE'}`);
  if (profile?.planTier !== 'PRO') throw new Error('Profile was not upgraded to PRO');
  console.log('\n✅ Billing flow end-to-end: PASS');
}

main().catch((err) => {
  console.error('\n❌ Billing flow test FAILED:', err.message);
  process.exit(1);
});
