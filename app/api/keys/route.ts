import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/payment';
import { createClient } from '@/lib/supabase-server';

// GET /api/keys — List user API keys
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        usageCount: true,
        monthlyLimit: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ keys });
  } catch (error: any) {
    console.error('Fetch API keys error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/keys — Create a new API key
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const name = body.name?.trim() || 'New API Key';

    // Fetch user profile to get limit based on tier
    let profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: userId,
          email: session.user.email || 'developer@user.com',
          planTier: 'FREE',
          subscriptionStatus: 'ACTIVE',
        },
      });
    }

    const monthlyLimit =
      profile.planTier === 'PRO' ? 10000 : profile.planTier === 'ENTERPRISE' ? 1000000 : 100;

    const rawSecret = crypto.randomBytes(16).toString('hex');
    const rawApiKey = `ls_live_${rawSecret}`;
    const keyHash = hashApiKey(rawApiKey);
    const keyPrefix = rawApiKey.slice(0, 12);

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        userId,
        keyHash,
        keyPrefix,
        name,
        monthlyLimit,
        usageCount: 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      apiKey: rawApiKey, // Displayed raw ONLY ONCE to user
      key: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        keyPrefix: apiKeyRecord.keyPrefix,
        usageCount: apiKeyRecord.usageCount,
        monthlyLimit: apiKeyRecord.monthlyLimit,
        isActive: apiKeyRecord.isActive,
        createdAt: apiKeyRecord.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create API key error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
