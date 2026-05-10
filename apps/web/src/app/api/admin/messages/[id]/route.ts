import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/guards';
import { prisma } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const msgId = Number(id);

  // Delete replies first, then parent
  await prisma.message.deleteMany({ where: { parentId: msgId } });
  await prisma.message.delete({ where: { id: msgId } });

  return NextResponse.json({ ok: true });
}
