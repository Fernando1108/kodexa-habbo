import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.rank < 7) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit  = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 10)));
  const search = searchParams.get('search') ?? '';
  const rank   = searchParams.get('rank')   ?? '';
  const status = searchParams.get('status') ?? '';

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { username: { contains: search } },
      { email:    { contains: search } },
    ];
  }
  if (rank && !isNaN(Number(rank))) {
    where.rank = Number(rank);
  }
  if (status === 'online')  where.online = true;
  if (status === 'offline') where.online = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, username: true, email: true,
        rank: true, credits: true, online: true, lastLogin: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, pages: Math.ceil(total / limit), page, limit });
}
