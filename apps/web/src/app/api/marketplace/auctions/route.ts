import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const auctions = await prisma.kxAuction.findMany({
      where:   { status: 'active', endsAt: { gt: new Date() } },
      include: {
        itemBase: { select: { publicName: true, spriteId: true } },
        seller:   { select: { username: true } },
        bidder:   { select: { username: true } },
      },
      orderBy: { endsAt: 'asc' },
    });

    return NextResponse.json({ auctions });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
