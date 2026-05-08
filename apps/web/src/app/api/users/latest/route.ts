import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' },
    select:  { username: true, look: true, createdAt: true },
  });
  if (!user) return NextResponse.json(null);
  return NextResponse.json({ username: user.username, look: user.look, createdAt: user.createdAt.toISOString() });
}
