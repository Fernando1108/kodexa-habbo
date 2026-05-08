import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/messages?box=inbox|sent&page=1
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { username: session.user.username } });
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const url    = new URL(req.url);
  const box    = url.searchParams.get('box') ?? 'inbox';
  const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const take   = 20;
  const skip   = (page - 1) * take;

  const where =
    box === 'sent'
      ? { fromId: me.id, parentId: null, NOT: { deletedBy: { contains: 'from' } } }
      : { toId: me.id,   parentId: null, NOT: { deletedBy: { contains: 'to'   } } };

  const [threads, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        from: { select: { id: true, username: true, look: true, rank: true } },
        to:   { select: { id: true, username: true, look: true, rank: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            from: { select: { id: true, username: true } },
            to:   { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.message.count({ where }),
  ]);

  const unreadCount = await prisma.message.count({
    where: { toId: me.id, read: false },
  });

  return NextResponse.json({ threads, total, pages: Math.ceil(total / take), unreadCount });
}

// POST /api/messages  { toUsername, body, parentId? }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { username: session.user.username } });
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { toUsername, body, parentId } = await req.json();

  if (!body?.trim()) return NextResponse.json({ error: 'body requerido' }, { status: 400 });

  // For replies, derive toId from parent
  let toId: number;
  if (parentId) {
    const parent = await prisma.message.findUnique({ where: { id: Number(parentId) } });
    if (!parent) return NextResponse.json({ error: 'Mensaje padre no encontrado' }, { status: 404 });
    // Reply goes to whoever isn't me
    toId = parent.fromId === me.id ? parent.toId : parent.fromId;
  } else {
    if (!toUsername) return NextResponse.json({ error: 'toUsername requerido' }, { status: 400 });
    const recipient = await prisma.user.findUnique({ where: { username: toUsername } });
    if (!recipient) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    if (recipient.id === me.id) return NextResponse.json({ error: 'No puedes enviarte un mensaje a ti mismo' }, { status: 400 });
    toId = recipient.id;
  }

  const message = await prisma.message.create({
    data: {
      fromId:   me.id,
      toId,
      body:     body.trim().slice(0, 1000),
      parentId: parentId ? Number(parentId) : null,
    },
    include: {
      from: { select: { id: true, username: true } },
      to:   { select: { id: true, username: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
