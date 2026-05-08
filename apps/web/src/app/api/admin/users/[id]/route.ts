import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const EditSchema = z.object({
  email:   z.string().email().optional(),
  rank:    z.number().int().min(1).max(7).optional(),
  credits: z.number().int().min(0).optional(),
  motto:   z.string().max(127).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.rank < 7) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body   = await req.json();
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: userId },
    data:  parsed.data,
    select: { id: true, username: true, email: true, rank: true, credits: true, motto: true },
  });

  await prisma.kxActivityLog.create({
    data: {
      userId:  parseInt(session.user.id),
      action:  'admin_edit_user',
      details: `Editó al usuario #${userId}`,
    },
  });

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.rank < 7) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  await prisma.user.delete({ where: { id: userId } });

  await prisma.kxActivityLog.create({
    data: {
      userId:  parseInt(session.user.id),
      action:  'admin_delete_user',
      details: `Eliminó al usuario #${userId}`,
    },
  });

  return NextResponse.json({ ok: true });
}
