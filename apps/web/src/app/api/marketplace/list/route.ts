import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  itemId: z.number().int().positive(),
  price:  z.number().int().min(1).max(10_000_000),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = Number(session.user.id);

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });

    const { itemId, price } = parsed.data;

    const item = await prisma.item.findFirst({ where: { id: itemId, userId } });
    if (!item) return NextResponse.json({ error: 'Item no encontrado o no te pertenece' }, { status: 404 });

    const existing = await prisma.kxMarketplaceListing.findFirst({ where: { itemId, status: 'active' } });
    if (existing) return NextResponse.json({ error: 'El item ya está listado en el marketplace' }, { status: 409 });

    const listing = await prisma.kxMarketplaceListing.create({
      data: {
        userId,
        itemId,
        price,
        status:    'active',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ ok: true, listing }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
