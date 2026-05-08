import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const [users, count] = await Promise.all([
    prisma.user.findMany({
      where:   { online: true },
      take:    12,
      orderBy: { lastLogin: 'desc' },
      select:  { username: true, look: true, rank: true },
    }),
    prisma.user.count({ where: { online: true } }),
  ]);

  return NextResponse.json({ users, count });
}
