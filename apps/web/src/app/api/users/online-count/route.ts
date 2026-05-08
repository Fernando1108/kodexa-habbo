import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const count = await prisma.user.count({ where: { online: true } });
  return NextResponse.json({ count });
}
