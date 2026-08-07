import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));

    // Revoke specific key by ID or deactivate all keys if keyId not provided
    if (body.keyId) {
      await prisma.apiKey.updateMany({
        where: { id: body.keyId, userId },
        data: { isActive: false },
      });
    } else {
      await prisma.apiKey.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API key revocation failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
