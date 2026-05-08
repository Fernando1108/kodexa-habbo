import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.rank < 4) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const words = await prisma.wordfilter.findMany({ orderBy: { word: 'asc' } });
  return NextResponse.json(words);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { word, replacement, type } = await req.json();
  if (!word) return NextResponse.json({ error: 'word requerido' }, { status: 400 });

  const entry = await prisma.wordfilter.create({
    data: {
      word: word.toLowerCase().trim(),
      replacement: replacement || '****',
      type: type || 'block',
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
