import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = Number(session.user.id);

    const { id } = await params;
    const listingId = Number(id);

    const listing = await prisma.kxMarketplaceListing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: 'Listing no encontrado' }, { status: 404 });
    if (listing.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (listing.status !== 'active') return NextResponse.json({ error: 'Listing no está activo' }, { status: 400 });

    await prisma.kxMarketplaceListing.update({ where: { id: listingId }, data: { status: 'cancelled' } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
