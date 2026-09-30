import crypto from 'crypto';
import { prisma } from './prisma';
import { hashApiKey } from './payment';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

export const TIER_LIMITS: Record<string, number> = {
  FREE: 100,
  PRO: 10000,
  ENTERPRISE: 1000000,
};

export interface ActivatePaidTierArgs {
  userId: string;
  email?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  tier: 'PRO' | 'ENTERPRISE';
}

export interface ActivationResult {
  planTier: PlanTier;
  generatedKey: string | null;
}

/**
 * activatePaidTier
 * Single source of truth for recording a successful Stripe payment:
 * upserts the Profile to the paid tier (idempotent) and provisions a live
 * API key at the tier's monthly limit if the user has no active key at that
 * limit yet. Called from both the verify-session endpoint (checkout redirect)
 * and the Stripe webhook (async confirmation) — safe to run from either or both.
 */
export async function activatePaidTier(args: ActivatePaidTierArgs): Promise<ActivationResult> {
  const planTier: PlanTier = args.tier === 'ENTERPRISE' ? PlanTier.ENTERPRISE : PlanTier.PRO;

  const profile = await prisma.profile.upsert({
    where: { id: args.userId },
    update: {
      ...(args.customerId ? { stripeCustomerId: args.customerId } : {}),
      ...(args.subscriptionId ? { stripeSubscriptionId: args.subscriptionId } : {}),
      planTier,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
    create: {
      id: args.userId,
      email: args.email || 'developer@company.com',
      ...(args.customerId ? { stripeCustomerId: args.customerId } : {}),
      ...(args.subscriptionId ? { stripeSubscriptionId: args.subscriptionId } : {}),
      planTier,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });

  // Provision a live key at the tier limit — only if the user has no active
  // key with that limit already (prevents duplicate keys on double-callback).
  const tierLimit = TIER_LIMITS[planTier] || TIER_LIMITS.FREE;
  const existingKey = await prisma.apiKey.findFirst({
    where: { userId: args.userId, isActive: true, monthlyLimit: { gte: tierLimit } },
  });

  let generatedKey: string | null = null;
  if (!existingKey) {
    const rawApiKey = `ls_live_${crypto.randomBytes(16).toString('hex')}`;
    await prisma.apiKey.create({
      data: {
        userId: args.userId,
        keyHash: hashApiKey(rawApiKey),
        keyPrefix: rawApiKey.slice(0, 12),
        name: `${planTier === PlanTier.ENTERPRISE ? 'Enterprise' : 'Pro'} Subscription Live Key`,
        monthlyLimit: tierLimit,
        usageCount: 0,
        isActive: true,
      },
    });
    generatedKey = rawApiKey;
  }

  return { planTier: profile.planTier, generatedKey };
}
