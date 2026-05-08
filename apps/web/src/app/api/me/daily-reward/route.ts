import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const REWARD_CREDITS = 100;
const REWARD_PIXELS  = 50;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.user.id);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const alreadyClaimed = await prisma.kxActivityLog.findFirst({
    where: {
      userId,
      action:    'daily_reward',
      createdAt: { gte: todayStart },
    },
  });

  if (alreadyClaimed) {
    return NextResponse.json({ error: 'Ya reclamaste tu recompensa hoy' }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data:  { credits: { increment: REWARD_CREDITS }, pixels: { increment: REWARD_PIXELS } },
    }),
    prisma.kxActivityLog.create({
      data: {
        userId,
        action:  'daily_reward',
        details: `+${REWARD_CREDITS} créditos, +${REWARD_PIXELS} píxeles`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, credits: REWARD_CREDITS, pixels: REWARD_PIXELS });
}
