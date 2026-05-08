import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const EditSchema = z.object({
  title:     z.string().min(1).max(128).optional(),
  content:   z.string().min(1).optional(),
  imageUrl:  z.string().optional(),
  published: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.rank < 7) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const newsId = parseInt(id);
  if (isNaN(newsId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body   = await req.json();
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const news = await prisma.news.update({
    where: { id: newsId },
    data:  parsed.data,
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({ news });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.rank < 7) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const newsId = parseInt(id);
  if (isNaN(newsId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  await prisma.news.delete({ where: { id: newsId } });
  return NextResponse.json({ ok: true });
}
