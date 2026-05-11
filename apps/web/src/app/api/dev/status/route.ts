import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessDevelopment } from '@/lib/guards';
import { prisma } from '@/lib/db';
import { isArcturusDevReady } from '@/lib/arcturus-dev-sync';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fresh rank — this endpoint is dev-only
  const user = await prisma.user.findUnique({
    where:  { id: parseInt(session.user.id) },
    select: { rank: true },
  });
  if (!user || !canAccessDevelopment(user.rank)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const devReady   = await isArcturusDevReady();
  const nitroDevUrl = process.env.NEXT_PUBLIC_NITRO_DEV_URL ?? null;
  const devDbUrl   = process.env.ARCTURUS_DEV_DB_URL        ?? null;

  return NextResponse.json({
    ok: true,
    status: {
      arcturusDevBootstrapped: devReady,
      nitroDevUrlConfigured:   !!nitroDevUrl,
      devDbUrlConfigured:      !!devDbUrl,
      // Never expose the actual URL strings — only booleans
      ready: devReady && !!nitroDevUrl && !!devDbUrl,
    },
  });
}
