import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.rank < 7) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [recentUsers, recentBans, recentAlerts] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, username: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.ban.findMany({
      where: { active: true },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 2,
    }),
    prisma.kxActivityLog.findMany({
      where: { action: 'hotel_alert' },
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 2,
    }),
  ]);

  const notifications = [
    ...recentUsers.map(u => ({
      id:      `user-${u.id}`,
      type:    'register' as const,
      text:    `Nuevo usuario: ${u.username}`,
      href:    '/admin/users',
      time:    u.createdAt.toISOString(),
    })),
    ...recentBans.map(b => ({
      id:      `ban-${b.id}`,
      type:    'ban' as const,
      text:    `Ban aplicado a ${b.user.username}`,
      href:    '/admin/bans',
      time:    b.createdAt.toISOString(),
    })),
    ...recentAlerts.map(a => ({
      id:      `alert-${a.id}`,
      type:    'alert' as const,
      text:    `Alerta enviada por ${a.user.username}`,
      href:    '/admin/alerts',
      time:    a.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  return NextResponse.json({ notifications });
}
