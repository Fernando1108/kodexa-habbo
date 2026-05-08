import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Newspaper, Calendar, User } from 'lucide-react';

export const metadata = { title: 'Noticias · Kodexa Hotel' };

const PER_PAGE = 12;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));

  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { author: { select: { username: true } } },
    }),
    prisma.news.count({ where: { published: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Newspaper size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Noticias del Hotel</h1>
          <p className="text-xs text-[#94A3B8]">{total} artículos publicados</p>
        </div>
      </div>

      {news.length === 0 ? (
        <div className="card text-center py-16">
          <Newspaper size={40} className="text-[#334155] mx-auto mb-3" />
          <p className="text-[#94A3B8]">No hay noticias publicadas aún.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {news.map((n) => (
            <Link key={n.id} href={`/community/news/${n.id}`} className="card group cursor-pointer block">
              {/* Image / gradient placeholder */}
              <div className="h-36 rounded-t-xl -mx-[1px] -mt-[1px] overflow-hidden mb-4"
                style={{
                  background: n.imageUrl
                    ? `url(${n.imageUrl}) center/cover`
                    : 'linear-gradient(135deg,rgba(0,212,170,.15),rgba(124,58,237,.15))',
                  borderRadius: '13px 13px 0 0',
                }}>
                {!n.imageUrl && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper size={36} className="text-primary/30" />
                  </div>
                )}
              </div>

              <div className="px-1">
                <h2 className="text-sm font-semibold text-[#F8FAFC] mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {n.title}
                </h2>
                <p className="text-xs text-[#94A3B8] line-clamp-3 mb-3 leading-relaxed">
                  {n.content.replace(/<[^>]+>/g, '').slice(0, 150)}
                  {n.content.length > 150 && '…'}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[#475569]">
                  <span className="flex items-center gap-1"><User size={10} />{n.author.username}</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(n.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10 text-sm">
          {page > 1 && (
            <Link href={`?page=${page - 1}`} className="btn btn-outline py-2 px-4 text-sm">Anterior</Link>
          )}
          <span className="text-[#475569] font-mono">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <Link href={`?page=${page + 1}`} className="btn btn-outline py-2 px-4 text-sm">Siguiente</Link>
          )}
        </div>
      )}
    </main>
  );
}
