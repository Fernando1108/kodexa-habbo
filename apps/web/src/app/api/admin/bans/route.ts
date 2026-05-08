import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.rank < 4) return null;
  return session;
}

function durationToDate(duration: string): Date | null {
  const now = Date.now();
  const map: Record<string, number> = {
    '1h':  3600000,
    '6h':  21600000,
    '24h': 86400000,
    '7d':  604800000,
    '30d': 2592000000,
  };
  if (duration === 'perm') return null;
  const ms = map[duration];
  if (!ms) return null;
  return new Date(now + ms);
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const take = 20;
  const skip = (page - 1) * take;

  const [bans, total] = await Promise.all([
    prisma.ban.findMany({
      where: { active: true },
      include: { user: { select: { username: true } }, admin: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.ban.count({ where: { active: true } }),
  ]);

  return NextResponse.json({ bans, total, pages: Math.ceil(total / take) });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { username, type, reason, duration } = await req.json();

  if (!username || !reason) {
    return NextResponse.json({ error: 'username y reason requeridos' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const adminUser = await prisma.user.findUnique({ where: { username: session.user.username } });
  if (!adminUser) return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 });

  const expiresAt = durationToDate(duration ?? 'perm');

  const ban = await prisma.ban.create({
    data: {
      userId:    target.id,
      bannedBy:  adminUser.id,
      type:      type ?? 'ban',
      reason,
      expiresAt,
      ip:        target.ipCurrent,
    },
  });

  await prisma.kxActivityLog.create({
    data: {
      userId:  adminUser.id,
      action:  'ban_applied',
      details: `Ban ${type ?? 'ban'} a ${username}: ${reason}`,
    },
  });

  return NextResponse.json(ban);
}
