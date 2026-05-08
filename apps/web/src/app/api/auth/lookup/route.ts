import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 3) {
    return NextResponse.json({ found: false });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: q },
        { email:    q },
      ],
    },
    select: {
      username: true,
      look:     true,
      rank:     true,
    },
  });

  if (!user) return NextResponse.json({ found: false });

  return NextResponse.json({
    found:    true,
    username: user.username,
    look:     user.look,
    rank:     user.rank,
  });
}
