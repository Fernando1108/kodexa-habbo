import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Activity } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { EmptyState }      from '@/components/admin/EmptyState';

export const metadata = { title: 'Logs · Admin Kodexa' };

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

// Map action keywords → badge classes (token-based, no hex)
function logBadgeClass(action: string): string {
  if (action.includes('ban'))         return 'badge badge-danger';
  if (action.includes('kick'))        return 'badge badge-danger';
  if (action.includes('login'))       return 'badge badge-ok';
  if (action.includes('register'))    return 'badge badge-info';
  if (action.includes('purchase'))    return 'badge badge-warn';
  if (action.includes('badge_given')) return 'badge badge-warn';
  if (action.includes('hotel_alert')) return 'badge badge-info';
  return 'badge badge-mono';
}

const ACTION_TYPES = ['login', 'register', 'ban_applied', 'badge_given', 'hotel_alert', 'purchase'];

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; user?: string; action?: string }>;
}) {
  const sp = await searchParams;
  const page        = Math.max(1, parseInt(sp.page ?? '1'));
  const userFilter  = sp.user   ?? '';
  const actionFilter = sp.action ?? '';
  const take = 50;
  const skip = (page - 1) * take;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (userFilter)   where.user   = { username: { contains: userFilter } };
  if (actionFilter) where.action = actionFilter;

  const [logs, total] = await Promise.all([
    prisma.kxActivityLog.findMany({
      where,
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.kxActivityLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / take);
  const hasFilter  = !!(userFilter || actionFilter);

  function pageUrl(p: number) {
    const q = new URLSearchParams();
    if (p > 1)       q.set('page',   String(p));
    if (userFilter)  q.set('user',   userFilter);
    if (actionFilter) q.set('action', actionFilter);
    return `?${q.toString()}`;
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Sistema"
        title="Logs de actividad"
        subtitle={`${total.toLocaleString()} ${total === 1 ? 'registro' : 'registros'}${hasFilter ? ' · filtro activo' : ''}`}
      />

      {/* Filters */}
      <form className="flex items-center gap-2 flex-wrap mb-4">
        <input
          name="user"
          defaultValue={userFilter}
          placeholder="Filtrar por usuario…"
          className="inp text-sm"
          style={{ width: 180 }}
        />
        <select
          name="action"
          defaultValue={actionFilter}
          className="inp text-sm"
          style={{ width: 200 }}
        >
          <option value="">Todas las acciones</option>
          {ACTION_TYPES.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-outline text-sm py-2 px-4">
          Filtrar
        </button>
        {hasFilter && (
          <Link
            href="/admin/logs"
            className="btn btn-ghost text-sm py-2 px-3"
            style={{ color: 'var(--admin-text-subtle)' }}
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="kx w-full">
            <thead>
              <tr>
                <th>Tiempo</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <EmptyState
                      icon={<Activity className="w-8 h-8" />}
                      title={hasFilter ? 'Sin resultados para este filtro' : 'Aún no hay actividad registrada'}
                      description={hasFilter ? 'Prueba con otros parámetros de búsqueda.' : 'Los eventos del sistema aparecerán aquí cuando ocurran.'}
                    />
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td
                      className="text-xs font-mono whitespace-nowrap"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    >
                      {timeAgo(log.createdAt)}
                    </td>
                    <td>
                      <Link
                        href={`/admin/users?q=${encodeURIComponent(log.user.username)}`}
                        className="text-xs font-mono hover:underline"
                        style={{ color: 'var(--admin-primary)' }}
                      >
                        {log.user.username}
                      </Link>
                    </td>
                    <td>
                      <span className={logBadgeClass(log.action)}>
                        {log.action}
                      </span>
                    </td>
                    <td
                      className="text-xs max-w-sm truncate"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between mt-4 text-sm"
          style={{ color: 'var(--admin-text-subtle)' }}
        >
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageUrl(page - 1)} className="btn btn-outline text-xs py-1.5 px-4">
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} className="btn btn-outline text-xs py-1.5 px-4">
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
