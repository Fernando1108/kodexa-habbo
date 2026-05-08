import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PATCH /api/messages/[id]  { read: true }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { username: session.user.username } });
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const msg = await prisma.message.findUnique({ where: { id: Number(id) } });
  if (!msg || msg.toId !== me.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.message.update({
    where: { id: Number(id) },
    data:  { read: body.read ?? true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/messages/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { username: session.user.username } });
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;
  const msg = await prisma.message.findUnique({ where: { id: Number(id) } });
  if (!msg || (msg.fromId !== me.id && msg.toId !== me.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Soft delete: track who deleted
  const isSender    = msg.fromId === me.id;
  const currentDel  = msg.deletedBy;
  let newDel: string;

  if (isSender) {
    newDel = currentDel.includes('to') ? 'both' : 'from';
  } else {
    newDel = currentDel.includes('from') ? 'both' : 'to';
  }

  if (newDel === 'both') {
    // Both deleted → hard delete
    await prisma.message.deleteMany({ where: { parentId: msg.id } });
    await prisma.message.delete({ where: { id: msg.id } });
  } else {
    await prisma.message.update({ where: { id: msg.id }, data: { deletedBy: newDel } });
  }

  return NextResponse.json({ ok: true });
}
