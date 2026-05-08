import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function requireAdmin(minRank = 7) {
  const session = await auth();
  if (!session?.user || session.user.rank < minRank) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = await prisma.websiteSetting.findMany({ orderBy: { key: 'asc' } });
  return NextResponse.json(Object.fromEntries(settings.map(s => [s.key, s.value])));
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin(7);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: Record<string, string> = await req.json();
  const entries = Object.entries(body);

  await Promise.all(
    entries.map(([key, value]) =>
      prisma.websiteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
