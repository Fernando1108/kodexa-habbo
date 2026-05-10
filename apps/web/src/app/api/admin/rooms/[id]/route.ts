import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/guards';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const EditSchema = z.object({
  name:        z.string().min(1).max(64).optional(),
  description: z.string().max(128).optional(),
  maxUsers:    z.number().int().min(1).max(50).optional(),
  state:       z.enum(['open', 'locked', 'password']).optional(),
  category:    z.number().int().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body   = await req.json();
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const room = await prisma.room.update({
    where: { id: roomId },
    data:  parsed.data,
  });

  return NextResponse.json({ room });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  await prisma.room.delete({ where: { id: roomId } });
  return NextResponse.json({ ok: true });
}
