import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAdmin } from '@/lib/guards';
import { prisma } from '@/lib/db';
import { z } from 'zod';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await prisma.news.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

const CreateSchema = z.object({
  title:     z.string().min(1).max(128),
  slug:      z.string().max(256).optional(),
  excerpt:   z.string().max(512).optional(),
  content:   z.string().min(1),
  imageUrl:  z.string().url().optional().or(z.literal('')),
  status:    z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !canAccessAdmin(session.user.rank ?? 1)) {
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
  if (!session?.user?.id || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 });
  }

  const { title, slug: rawSlug, excerpt, content, imageUrl, status } = parsed.data;
  const resolvedStatus = status ?? 'DRAFT';
  const baseSlug  = rawSlug ? toSlug(rawSlug) : toSlug(title);
  const finalSlug = await uniqueSlug(baseSlug || `noticia-${Date.now()}`);

  const news = await prisma.news.create({
    data: {
      title,
      slug:        finalSlug,
      excerpt:     excerpt ?? '',
      content,
      imageUrl:    imageUrl ?? '',
      status:      resolvedStatus,
      authorId:    parseInt(session.user.id),
      publishedAt: resolvedStatus === 'PUBLISHED' ? new Date() : null,
    },
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({ news }, { status: 201 });
}
