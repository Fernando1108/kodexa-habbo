import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Plus, Newspaper, Pencil, Calendar, User } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge }     from '@/components/admin/StatusBadge';
import { EmptyState }      from '@/components/admin/EmptyState';
import NewsAdminActions     from './NewsAdminActions';

export const metadata = { title: 'Noticias · Admin — Kodexa Hotel' };

// Color of the left accent bar per status
const STATUS_BAR: Record<string, string> = {
  PUBLISHED: 'var(--admin-success)',
  DRAFT:     'var(--admin-warning)',
  ARCHIVED:  'var(--admin-text-subtle)',
};

export default async function AdminNewsPage() {
  const news = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true } } },
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Contenido"
        title="Noticias del hotel"
        subtitle={`${news.length} ${news.length === 1 ? 'artículo' : 'artículos'} en total`}
        actions={
          <Link href="/admin/news/create" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Nueva noticia
          </Link>
        }
      />

      {news.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Newspaper className="w-8 h-8" />}
            title="No hay noticias todavía"
            description="Crea la primera noticia para que aparezca en el hotel."
            action={
              <Link href="/admin/news/create" className="btn btn-primary">
                <Plus className="w-4 h-4" />
                Crear la primera noticia
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {news.map((n) => (
            <div key={n.id} className="card flex items-center gap-4">

              {/* Status accent bar */}
              <div
                className="hidden sm:flex w-1 self-stretch rounded-full flex-shrink-0"
                style={{ background: STATUS_BAR[n.status] ?? STATUS_BAR.DRAFT }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatusBadge status={n.status} />
                  {n.slug && (
                    <code
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--admin-surface-soft)', color: 'var(--admin-text-muted)' }}
                    >
                      /{n.slug}
                    </code>
                  )}
                </div>
                <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--admin-text)' }}>
                  {n.title}
                </h3>
                {n.excerpt && (
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--admin-text-muted)' }}>
                    {n.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--admin-text-subtle)' }}>
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
                    <span className="flex items-center gap-1" style={{ color: 'var(--admin-success)' }}>
                      Publicado{' '}
                      {new Date(n.publishedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
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
                    style={{ color: 'var(--admin-primary)' }}
                  >
                    Ver pública
                  </Link>
                )}
                <NewsAdminActions newsId={n.id} currentStatus={n.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
