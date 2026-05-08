import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = Number(session.user.id);

    const { id } = await params;
    const listingId = Number(id);

    const listing = await prisma.kxMarketplaceListing.findUnique({
      where:   { id: listingId },
      include: { item: true, user: { select: { id: true, credits: true } } },
    });

    if (!listing) return NextResponse.json({ error: 'Listing no encontrado' }, { status: 404 });
    if (listing.status !== 'active') return NextResponse.json({ error: 'Listing no está activo' }, { status: 400 });
    if (listing.expiresAt <= new Date()) return NextResponse.json({ error: 'Listing expirado' }, { status: 400 });
    if (listing.userId === userId) return NextResponse.json({ error: 'No puedes comprar tu propio listing' }, { status: 400 });

    const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
    if (!buyer) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    if (buyer.credits < listing.price) return NextResponse.json({ error: 'No tienes suficientes créditos' }, { status: 400 });

    const commission  = Math.floor(listing.price * 0.05);
    const sellerAmount = listing.price - commission;

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { credits: { decrement: listing.price } } }),
      prisma.user.update({ where: { id: listing.userId }, data: { credits: { increment: sellerAmount } } }),
      prisma.item.update({ where: { id: listing.itemId }, data: { userId } }),
      prisma.kxMarketplaceListing.update({ where: { id: listing.id }, data: { status: 'sold', buyerId: userId } }),
      prisma.kxActivityLog.create({
        data: {
          userId,
          action:  'marketplace_buy',
          details: `Compró item #${listing.itemId} por ${listing.price} créditos`,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
