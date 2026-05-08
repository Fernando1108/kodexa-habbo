import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const CreateSchema = z.object({
  title:     z.string().min(1).max(128),
  content:   z.string().min(1),
  imageUrl:  z.string().url().optional().or(z.literal('')),
  published: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.rank < 7) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const news = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({ news });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.rank < 7) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });

  const news = await prisma.news.create({
    data: {
      title:     parsed.data.title,
      content:   parsed.data.content,
      imageUrl:  parsed.data.imageUrl ?? '',
      published: parsed.data.published ?? false,
      authorId:  parseInt(session.user.id),
    },
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({ news }, { status: 201 });
}
