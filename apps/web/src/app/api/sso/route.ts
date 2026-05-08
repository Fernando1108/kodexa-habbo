import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ticket = crypto.randomUUID();

  await prisma.user.update({
    where: { id: parseInt(session.user.id) },
    data:  { authTicket: ticket },
  });

  return NextResponse.json({ ticket });
}
