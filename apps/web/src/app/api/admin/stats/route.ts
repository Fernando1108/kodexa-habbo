import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/guards';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [onlineUsers, totalUsers, totalRooms, creditsAgg] = await Promise.all([
    prisma.user.count({ where: { online: true } }),
    prisma.user.count(),
    prisma.room.count(),
    prisma.user.aggregate({ _sum: { credits: true } }),
  ]);

  return NextResponse.json({
    onlineUsers,
    totalUsers,
    totalRooms,
    totalCredits: creditsAgg._sum.credits ?? 0,
  });
}
