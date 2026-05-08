import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit  = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const search = searchParams.get('search') ?? '';
    const sort   = searchParams.get('sort') ?? 'newest';

    const orderBy =
      sort === 'price_asc'  ? { price: 'asc'  as const } :
      sort === 'price_desc' ? { price: 'desc' as const } :
                              { createdAt: 'desc' as const };

    const where = {
      status: 'active' as const,
      expiresAt: { gt: new Date() },
      ...(search ? { item: { itemBase: { publicName: { contains: search } } } } : {}),
    };

    const [listings, total] = await Promise.all([
      prisma.kxMarketplaceListing.findMany({
        where,
        include: {
          user: { select: { username: true } },
          item: { include: { itemBase: { select: { publicName: true, spriteId: true } } } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kxMarketplaceListing.count({ where }),
    ]);

    return NextResponse.json({ listings, total, pages: Math.ceil(total / limit), page });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
