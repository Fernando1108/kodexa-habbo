import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/guards';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, target, roomId } = await req.json();
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'message requerido' }, { status: 400 });
  }

  const adminUser = await prisma.user.findUnique({ where: { username: session.user.username } });
  if (!adminUser) return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 });

  const details = target === 'room' && roomId
    ? `[Sala ${roomId}] ${message.trim()}`
    : `[Global] ${message.trim()}`;

  const log = await prisma.kxActivityLog.create({
    data: {
      userId:  adminUser.id,
      action:  'hotel_alert',
      details,
    },
  });

  // TODO: forward alert to emulator via Redis pub/sub or HTTP
  console.log('[Alert]', { from: session.user.username, target, roomId, message });

  return NextResponse.json({
    ok: true,
    log: { id: log.id, by: adminUser.username, sentAt: log.createdAt.toISOString() },
  });
}
