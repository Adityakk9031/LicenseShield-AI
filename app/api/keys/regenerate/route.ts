import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/payment';
import { createClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Deactivate old keys for user via Prisma
    await prisma.apiKey.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // 2. Fetch user profile for monthly limit calculation
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    const planTier = profile?.planTier || 'FREE';
    const monthlyLimit = planTier === 'PRO' ? 10000 : planTier === 'ENTERPRISE' ? 1000000 : 100;

    // 3. Generate new API key and persist via Prisma
    const rawSecret = crypto.randomBytes(16).toString('hex');
    const rawApiKey = `ls_live_${rawSecret}`;
    const keyHash = hashApiKey(rawApiKey);
    const keyPrefix = rawApiKey.slice(0, 12);

    await prisma.apiKey.create({
      data: {
        userId,
        keyHash,
        keyPrefix,
        name: 'Regenerated API Key',
        monthlyLimit,
        usageCount: 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      apiKey: rawApiKey,
      keyPrefix,
      monthlyLimit,
    });
  } catch (error: any) {
    console.error('API key regeneration failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
