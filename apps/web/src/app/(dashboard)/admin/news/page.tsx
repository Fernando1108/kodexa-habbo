import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Plus, Newspaper, Pencil, Calendar, User } from 'lucide-react';
import NewsAdminActions from './NewsAdminActions';

export const metadata = { title: 'Noticias · Admin — Kodexa Hotel' };

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: 'Publicado',  cls: 'badge badge-ok' },
  DRAFT:     { label: 'Borrador',   cls: 'badge badge-warn' },
  ARCHIVED:  { label: 'Archivado',  cls: 'badge badge-mono' },
};

export default async function AdminNewsPage() {
  const news = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true } } },
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-xs uppercase font-mono tracking-[.2em]" style={{ color: '#94A3B8' }}>
            Comunicación
          </div>
          <h1 className="mt-1 text-3xl font-bold">Noticias del hotel</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            {news.length} {news.length === 1 ? 'artículo' : 'artículos'} en total
          </p>
        </div>
        <Link href="/admin/news/create" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Nueva noticia
        </Link>
      </div>

      {/* List */}
      {news.length === 0 ? (
        <div className="card p-12 text-center" style={{ color: '#94A3B8' }}>
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <div className="text-sm">No hay noticias todavía.</div>
          <Link href="/admin/news/create" className="btn btn-primary mt-4 mx-auto inline-flex">
            <Plus className="w-4 h-4" />
            Crear la primera noticia
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {news.map((n) => {
            const badge = STATUS_BADGE[n.status] ?? STATUS_BADGE.DRAFT;
            return (
              <div key={n.id} className="card flex items-center gap-4">
                {/* Status indicator */}
                <div
                  className="hidden sm:flex w-1 self-stretch rounded-full flex-shrink-0"
                  style={{
                    background: n.status === 'PUBLISHED' ? '#10B981'
                      : n.status === 'ARCHIVED' ? '#475569'
                      : '#F59E0B',
                  }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={badge.cls}>{badge.label}</span>
                    {n.slug && (
                      <code className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#1E293B', color: '#94A3B8' }}>
                        /{n.slug}
                      </code>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold truncate">{n.title}</h3>
                  {n.excerpt && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#94A3B8' }}>{n.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: '#475569' }}>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />{n.author.username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    {n.publishedAt && (
                      <span className="flex items-center gap-1" style={{ color: '#10B981' }}>
                        Publicado {new Date(n.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="hidden sm:flex flex-col gap-1.5 items-stretch flex-shrink-0">
                  <Link href={`/admin/news/${n.id}/edit`} className="btn btn-outline text-xs">
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </Link>
                  {n.status === 'PUBLISHED' && n.slug && (
                    <Link
                      href={`/community/news/${n.slug}`}
                      target="_blank"
                      className="btn btn-ghost text-xs"
                      style={{ color: '#00D4AA' }}
                    >
                      Ver pública
                    </Link>
                  )}
                  <NewsAdminActions newsId={n.id} currentStatus={n.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
