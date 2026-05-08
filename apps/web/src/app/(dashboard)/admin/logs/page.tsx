import { prisma } from '@/lib/db';
import Link from 'next/link';

export const metadata = { title: 'Logs · Admin Kodexa' };

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

const ACTION_COLORS: Record<string, string> = {
  login:        '#10B981',
  register:     '#3B82F6',
  ban:          '#EF4444',
  ban_applied:  '#EF4444',
  purchase:     '#F59E0B',
  badge_given:  '#F59E0B',
  kick:         '#F97316',
  hotel_alert:  '#7C3AED',
};

function actionColor(action: string) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return color;
  }
  return '#94A3B8';
}

const ACTION_TYPES = ['login', 'register', 'ban_applied', 'badge_given', 'hotel_alert', 'purchase'];

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; user?: string; action?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1'));
  const userFilter = sp.user ?? '';
  const actionFilter = sp.action ?? '';
  const take = 50;
  const skip = (page - 1) * take;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (userFilter) where.user = { username: { contains: userFilter } };
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

  function pageUrl(p: number) {
    const q = new URLSearchParams();
    if (p > 1) q.set('page', String(p));
    if (userFilter) q.set('user', userFilter);
    if (actionFilter) q.set('action', actionFilter);
    return `?${q.toString()}`;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Logs de Actividad</h1>
          <p className="text-sm text-[#94A3B8] mt-1">{total.toLocaleString()} registros</p>
        </div>
        {/* Filters as form */}
        <form className="flex items-center gap-2 flex-wrap">
          <input
            name="user"
            defaultValue={userFilter}
            placeholder="Filtrar usuario…"
            className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
            style={{ width: 160 }}
          />
          <select
            name="action"
            defaultValue={actionFilter}
            className="px-3 py-2 rounded-xl bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
          >
            <option value="">Todas las acciones</option>
            {ACTION_TYPES.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-outline py-2 px-4 text-sm">Filtrar</button>
          {(userFilter || actionFilter) && (
            <Link href="/admin/logs" className="btn btn-ghost py-2 px-3 text-sm text-[#475569]">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-xl border border-[#1f2b41] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#0a1224', borderBottom: '1px solid #1f2b41' }}>
              {['Tiempo', 'Usuario', 'Acción', 'Detalles'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-[#475569]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2b41]">
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#475569]">
                  No hay logs{userFilter || actionFilter ? ' para este filtro' : ' aún'}
                </td>
              </tr>
            )}
            {logs.map(log => (
              <tr key={log.id} style={{ background: '#0e1627' }}>
                <td className="px-4 py-3 text-xs font-mono text-[#475569] whitespace-nowrap">
                  {timeAgo(log.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/users?q=${log.user.username}`} className="text-xs font-mono text-primary hover:underline">
                    {log.user.username}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium"
                    style={{ color: actionColor(log.action), background: actionColor(log.action) + '18' }}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#94A3B8] max-w-sm truncate">
                  {log.details || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-[#475569]">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={pageUrl(page - 1)} className="btn btn-outline py-1.5 px-4 text-xs">Anterior</Link>}
            {page < totalPages && <Link href={pageUrl(page + 1)} className="btn btn-outline py-1.5 px-4 text-xs">Siguiente</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
