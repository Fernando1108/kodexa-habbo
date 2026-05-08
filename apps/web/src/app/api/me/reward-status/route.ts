import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ claimed: false });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const log = await prisma.kxActivityLog.findFirst({
    where: {
      userId:    Number(session.user.id),
      action:    'daily_reward',
      createdAt: { gte: todayStart },
    },
  });

  return NextResponse.json({ claimed: !!log });
}
