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

async function uniqueSlug(base: string, excludeId: number): Promise<string> {
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

const EditSchema = z.object({
  title:    z.string().min(1).max(128).optional(),
  slug:     z.string().max(256).optional(),
  excerpt:  z.string().max(512).optional(),
  content:  z.string().min(1).optional(),
  imageUrl: z.string().optional(),
  status:   z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const newsId = parseInt(id);
  if (isNaN(newsId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const news = await prisma.news.findUnique({
    where: { id: newsId },
    include: { author: { select: { username: true } } },
  });

  if (!news) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ news });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const newsId = parseInt(id);
  if (isNaN(newsId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const body   = await req.json();
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const { title, slug: rawSlug, status, ...rest } = parsed.data;

  // Resolve slug if title or slug changed
  let resolvedSlug: string | undefined;
  if (rawSlug !== undefined) {
    const base = toSlug(rawSlug) || toSlug(title ?? '') || `noticia-${newsId}`;
    resolvedSlug = await uniqueSlug(base, newsId);
  } else if (title !== undefined) {
    // Don't auto-update slug on title change — preserve existing slug
  }

  // publishedAt: set when transitioning to PUBLISHED, clear when leaving
  let publishedAt: Date | null | undefined;
  if (status === 'PUBLISHED') {
    const existing = await prisma.news.findUnique({ where: { id: newsId }, select: { publishedAt: true } });
    publishedAt = existing?.publishedAt ?? new Date();
  } else if (status === 'DRAFT' || status === 'ARCHIVED') {
    publishedAt = null;
  }

  const news = await prisma.news.update({
    where: { id: newsId },
    data: {
      ...(title !== undefined     && { title }),
      ...(resolvedSlug !== undefined && { slug: resolvedSlug }),
      ...(status !== undefined    && { status }),
      ...(publishedAt !== undefined && { publishedAt }),
      ...rest,
    },
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({ news });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !canAccessAdmin(session.user.rank ?? 1)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const newsId = parseInt(id);
  if (isNaN(newsId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  await prisma.news.delete({ where: { id: newsId } });
  return NextResponse.json({ ok: true });
}
