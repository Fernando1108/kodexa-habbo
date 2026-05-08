import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await prisma.user.findFirst({
    orderBy: { credits: 'desc' },
    select:  { username: true, look: true, motto: true },
  });
  if (!user) return NextResponse.json(null);
  return NextResponse.json(user);
}
