import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = Number(session.user.id);

    const listings = await prisma.kxMarketplaceListing.findMany({
      where:   { userId },
      include: { item: { include: { itemBase: { select: { publicName: true, spriteId: true } } } } },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });

    return NextResponse.json({ listings });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
