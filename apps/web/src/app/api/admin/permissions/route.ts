import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.rank < 9) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, rankName, level, ...fields } = body;

  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const updated = await prisma.permission.update({
    where: { id: Number(id) },
    data: { rankName, level, ...fields },
  });

  return NextResponse.json(updated);
}
