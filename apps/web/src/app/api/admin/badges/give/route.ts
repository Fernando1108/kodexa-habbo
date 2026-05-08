import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.rank < 7) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username, badgeCode } = await req.json();

  if (!username || !badgeCode) {
    return NextResponse.json({ error: 'username y badgeCode requeridos' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  // Check if user already has this badge
  const existing = await prisma.userBadge.findFirst({
    where: { userId: user.id, badgeCode },
  });
  if (existing) {
    return NextResponse.json({ error: 'El usuario ya tiene este badge' }, { status: 409 });
  }

  const badge = await prisma.userBadge.create({
    data: { userId: user.id, badgeCode, slotNumber: 0 },
  });

  // Log the action
  await prisma.kxActivityLog.create({
    data: {
      userId: user.id,
      action: 'badge_given',
      details: `Badge ${badgeCode} dado por ${session.user.username}`,
    },
  });

  return NextResponse.json(badge);
}
