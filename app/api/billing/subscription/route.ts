import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/billing/subscription
 * Returns the signed-in user's plan tier and subscription status for the
 * dashboard plan card. Defaults to FREE when no Profile exists yet.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        planTier: true,
        subscriptionStatus: true,
        stripeSubscriptionId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      planTier: profile?.planTier || 'FREE',
      subscriptionStatus: profile?.subscriptionStatus || 'ACTIVE',
      hasSubscription: Boolean(profile?.stripeSubscriptionId),
    });
  } catch (error: any) {
    console.error('[Stripe Billing] Subscription fetch failed:', error);
    return NextResponse.json(
      { planTier: 'FREE', subscriptionStatus: 'ACTIVE', hasSubscription: false },
      { status: 200 }
    );
  }
}
