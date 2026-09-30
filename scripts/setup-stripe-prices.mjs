// One-off: validate STRIPE_SECRET_KEY and ensure PRO/ENTERPRISE test prices exist.
// Creates them if missing, prints the IDs to paste into .env.
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

async function ensurePrice(productId, amount, label) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = prices.data.find(
    (p) => p.recurring?.interval === 'month' && p.unit_amount === amount
  );
  if (existing) {
    console.log(`EXISTS ${label}: ${existing.id} ($${amount / 100}/mo)`);
    return existing.id;
  }
  const price = await stripe.prices.create({
    product: productId,
    currency: 'usd',
    unit_amount: amount,
    recurring: { interval: 'month' },
    nickname: label,
  });
  console.log(`CREATED ${label}: ${price.id} ($${amount / 100}/mo)`);
  return price.id;
}

async function ensureProduct(name) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find((p) => p.name === name);
  if (existing) {
    console.log(`EXISTS product: ${name} -> ${existing.id}`);
    return existing.id;
  }
  const product = await stripe.products.create({ name });
  console.log(`CREATED product: ${name} -> ${product.id}`);
  return product.id;
}

try {
  const account = await stripe.accounts.retrieve();
  console.log(`Key valid. Account: ${account.id} (${account.settings?.dashboard?.display_name || 'test'})`);

  const proProduct = await ensureProduct('LicenseShield AI Pro');
  const entProduct = await ensureProduct('LicenseShield AI Enterprise');

  const proPrice = await ensurePrice(proProduct, 2900, 'Pro monthly');
  const entPrice = await ensurePrice(entProduct, 19900, 'Enterprise monthly');

  console.log('\nPASTE INTO .env:');
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice}`);
  console.log(`STRIPE_ENTERPRISE_PRICE_ID=${entPrice}`);
} catch (err) {
  console.error('STRIPE ERROR:', err.message);
  process.exit(1);
}
