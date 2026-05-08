import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Calendar, User, Newspaper } from 'lucide-react';

export const metadata = { title: 'Noticia · Kodexa Hotel' };

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const newsId = Number(id);
  if (isNaN(newsId)) notFound();

  const [article, latest] = await Promise.all([
    prisma.news.findFirst({
      where: { id: newsId, published: true },
      include: { author: { select: { username: true } } },
    }),
    prisma.news.findMany({
      where: { published: true, id: { not: newsId } },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  if (!article) notFound();

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#475569] mb-6">
        <Link href="/community/news" className="hover:text-primary transition-colors">Noticias</Link>
        <span>/</span>
        <span className="text-[#94A3B8] line-clamp-1">{article.title}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        {/* Article */}
        <article className="card">
          {/* Header image */}
          <div className="h-52 rounded-xl overflow-hidden mb-6"
            style={{
              background: article.imageUrl
                ? `url(${article.imageUrl}) center/cover`
                : 'linear-gradient(135deg,rgba(0,212,170,.12),rgba(124,58,237,.12))',
            }}>
            {!article.imageUrl && (
              <div className="w-full h-full flex items-center justify-center">
                <Newspaper size={48} className="text-primary/20" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#F8FAFC] mb-4 leading-tight">{article.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#475569] mb-6 pb-6 border-b border-[#1f2b41]">
            <span className="flex items-center gap-1.5"><User size={12} />{article.author.username}</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {new Date(article.createdAt).toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>

          {/* Body */}
          <div className="text-sm text-[#94A3B8] leading-relaxed space-y-4">
            {article.content.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Back */}
          <div className="mt-8 pt-6 border-t border-[#1f2b41]">
            <Link href="/community/news" className="btn btn-outline py-2 px-4 text-sm flex items-center gap-2 w-fit">
              <ChevronLeft size={14} />Volver a noticias
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#475569]">Últimas noticias</h3>
          {latest.length === 0 && (
            <p className="text-xs text-[#334155]">No hay otras noticias.</p>
          )}
          {latest.map((n) => (
            <Link key={n.id} href={`/community/news/${n.id}`}
              className="card block p-3 hover:border-primary/30 transition-colors cursor-pointer">
              <h4 className="text-sm font-medium text-[#F8FAFC] line-clamp-2 mb-1">{n.title}</h4>
              <p className="text-[11px] text-[#475569]">
                {new Date(n.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </p>
            </Link>
          ))}
        </aside>
      </div>
    </main>
  );
}
