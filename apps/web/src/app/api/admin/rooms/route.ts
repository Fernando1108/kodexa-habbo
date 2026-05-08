import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.rank < 7) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') ?? '';
  const state  = searchParams.get('state')  ?? '';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name:      { contains: search } },
      { ownerName: { contains: search } },
    ];
  }
  if (state) where.state = state;

  const rooms = await prisma.room.findMany({
    where,
    select: {
      id: true, name: true, ownerName: true,
      maxUsers: true, score: true, state: true, category: true, description: true,
    },
    orderBy: { score: 'desc' },
    take: 50,
  });

  return NextResponse.json({ rooms });
}
