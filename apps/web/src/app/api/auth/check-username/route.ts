import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.trim() ?? '';

  if (!username || !/^[A-Za-z0-9_.]{3,20}$/.test(username)) {
    return NextResponse.json({ available: false });
  }

  const existing = await prisma.user.findUnique({
    where:  { username },
    select: { id: true },
  });

  return NextResponse.json({ available: !existing });
}
