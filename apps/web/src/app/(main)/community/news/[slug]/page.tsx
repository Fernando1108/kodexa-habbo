import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Calendar, User, Newspaper } from 'lucide-react';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.news.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { title: true, excerpt: true },
  });
  if (!article) return { title: 'Noticia no encontrada · Kodexa Hotel' };
  return {
    title:       `${article.title} · Kodexa Hotel`,
    description: article.excerpt || undefined,
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;

  const [article, latest] = await Promise.all([
    prisma.news.findFirst({
      where:   { slug, status: 'PUBLISHED' },
      include: { author: { select: { username: true } } },
    }),
    prisma.news.findMany({
      where:   { status: 'PUBLISHED', slug: { not: slug } },
      orderBy: { publishedAt: 'desc' },
      take:    3,
      select:  { id: true, slug: true, title: true, publishedAt: true, createdAt: true },
    }),
  ]);

  if (!article) notFound();

  // Render content as plain paragraphs — no dangerouslySetInnerHTML
  const paragraphs = article.content.split(/\n\n+/).filter(Boolean);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#475569] mb-6">
        <Link href="/community/news" className="hover:text-primary transition-colors">
          Noticias
        </Link>
        <span>/</span>
        <span className="text-[#94A3B8] line-clamp-1">{article.title}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        {/* Article */}
        <article className="card">
          {/* Cover */}
          <div
            className="h-52 rounded-xl overflow-hidden mb-6"
            style={{
              background: article.imageUrl
                ? `url(${article.imageUrl}) center/cover`
                : 'linear-gradient(135deg,rgba(0,212,170,.12),rgba(124,58,237,.12))',
            }}
          >
            {!article.imageUrl && (
              <div className="w-full h-full flex items-center justify-center">
                <Newspaper size={48} className="text-primary/20" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#F8FAFC] mb-4 leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-base text-[#94A3B8] mb-5 leading-relaxed border-l-2 pl-4" style={{ borderColor: '#7C3AED' }}>
              {article.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#475569] mb-6 pb-6 border-b border-[#1f2b41]">
            <span className="flex items-center gap-1.5">
              <User size={12} />{article.author.username}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {new Date(article.publishedAt ?? article.createdAt).toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>

          {/* Body — plain text paragraphs, no HTML injection */}
          <div className="text-sm text-[#94A3B8] leading-relaxed space-y-4">
            {paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Back */}
          <div className="mt-8 pt-6 border-t border-[#1f2b41]">
            <Link
              href="/community/news"
              className="btn btn-outline py-2 px-4 text-sm flex items-center gap-2 w-fit"
            >
              <ChevronLeft size={14} />
              Volver a noticias
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#475569]">
            Últimas noticias
          </h3>
          {latest.length === 0 && (
            <p className="text-xs text-[#334155]">No hay otras noticias.</p>
          )}
          {latest.map((n) => (
            n.slug ? (
              <Link
                key={n.id}
                href={`/community/news/${n.slug}`}
                className="card block p-3 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <h4 className="text-sm font-medium text-[#F8FAFC] line-clamp-2 mb-1">{n.title}</h4>
                <p className="text-[11px] text-[#475569]">
                  {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short',
                  })}
                </p>
              </Link>
            ) : null
          ))}
        </aside>
      </div>
    </main>
  );
}
