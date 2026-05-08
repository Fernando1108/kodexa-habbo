import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ count: 0 });

  const me = await prisma.user.findUnique({ where: { username: session.user.username } });
  if (!me) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: { toId: me.id, read: false },
  });

  return NextResponse.json({ count });
}
