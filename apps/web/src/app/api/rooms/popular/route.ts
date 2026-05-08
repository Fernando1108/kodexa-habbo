import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rooms = await prisma.room.findMany({
    where:   { state: 'open' },
    orderBy: { score: 'desc' },
    take:    5,
    select:  { id: true, name: true, ownerName: true, score: true, category: true },
  });
  return NextResponse.json(rooms);
}
