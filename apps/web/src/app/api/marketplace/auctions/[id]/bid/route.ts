import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({ amount: z.number().int().positive() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = Number(session.user.id);

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });

    const { amount } = parsed.data;
    const { id }     = await params;
    const auctionId  = Number(id);

    const auction = await prisma.kxAuction.findUnique({ where: { id: auctionId } });
    if (!auction) return NextResponse.json({ error: 'Subasta no encontrada' }, { status: 404 });
    if (auction.status !== 'active') return NextResponse.json({ error: 'Subasta no está activa' }, { status: 400 });
    if (auction.endsAt <= new Date()) return NextResponse.json({ error: 'Subasta expirada' }, { status: 400 });
    if (auction.sellerId === userId) return NextResponse.json({ error: 'No puedes pujar en tu propia subasta' }, { status: 400 });

    const minBid = auction.currentBid > 0 ? auction.currentBid : auction.startPrice;
    if (amount <= minBid) return NextResponse.json({ error: `La puja debe ser mayor a ${minBid}` }, { status: 400 });

    const bidder = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
    if (!bidder) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    if (bidder.credits < amount) return NextResponse.json({ error: 'No tienes suficientes créditos' }, { status: 400 });

    const prevBidderId  = auction.bidderId;
    const prevBid       = auction.currentBid;

    await prisma.$transaction(async (tx) => {
      await tx.kxAuction.update({ where: { id: auctionId }, data: { currentBid: amount, bidderId: userId } });
      await tx.user.update({ where: { id: userId }, data: { credits: { decrement: amount } } });
      if (prevBidderId !== null && prevBid > 0) {
        await tx.user.update({ where: { id: prevBidderId }, data: { credits: { increment: prevBid } } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
