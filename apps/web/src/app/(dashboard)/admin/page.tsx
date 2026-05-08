import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  UsersRound, UserPlus, Home, Coins,
  TrendingUp, TrendingDown, UserRound, Ban, Package, Gavel,
  Activity,
} from 'lucide-react';
import { RANK_LABELS, rankBadgeClass } from '@kodexa/shared';

function fmt(n: number) {
  return n.toLocaleString('es-ES');
}

function rel(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'ahora mismo';
  if (mins  < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

function rankLabel(rank: number) {
  return { label: RANK_LABELS[rank] ?? 'Normal', cls: rankBadgeClass(rank) };
}

const COLORS = [
  '#5BFFD7,#7C3AED','#F59E0B,#EF4444','#10B981,#00D4AA',
  '#7C3AED,#F472B6','#3B82F6,#06B6D4',
];

function ini(s: string) { return s.replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase(); }

const CHART_HEIGHTS = [22,18,15,12,10,14,18,28,42,55,68,72,78,82,88,92,98,87,75,82,90,76,58,46];

export default async function AdminPage() {
  const session = await auth();
  const username = session?.user?.username ?? 'Admin';

  const [onlineUsers, totalUsers, totalRooms, creditsAgg, recentUsers, recentLogs] = await Promise.all([
    prisma.user.count({ where: { online: true } }),
    prisma.user.count(),
    prisma.room.count(),
    prisma.user.aggregate({ _sum: { credits: true } }),
    prisma.user.findMany({
      select: { id: true, username: true, email: true, rank: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.kxActivityLog.findMany({
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalCredits = creditsAgg._sum.credits ?? 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-xs uppercase font-mono tracking-[.2em]" style={{ color: '#94A3B8' }}>Vista general</div>
          <h1 className="mt-1 text-3xl font-bold">
            Bienvenido, <span className="text-gradient">{username}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            {onlineUsers} jugadores online ahora mismo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline"><Activity className="w-4 h-4" />Ver logs</button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card metric m1">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,212,170,.15)', border: '1px solid rgba(0,212,170,.3)' }}>
              <UsersRound className="w-5 h-5" style={{ color: '#00D4AA' }} />
            </div>
            <span className="pulse-dot" />
          </div>
          <div className="mt-4 text-3xl font-bold tracking-tight">{fmt(onlineUsers)}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#94A3B8' }}>Usuarios online</div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3" style={{ color: '#10B981' }} />
            <span style={{ color: '#10B981' }} className="font-mono">activos</span>
            <span style={{ color: '#94A3B8' }}>ahora</span>
          </div>
        </div>

        <div className="card metric m2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.3)' }}>
            <UserPlus className="w-5 h-5" style={{ color: '#7C3AED' }} />
          </div>
          <div className="mt-4 text-3xl font-bold tracking-tight">{fmt(totalUsers)}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#94A3B8' }}>Registrados</div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3" style={{ color: '#10B981' }} />
            <span style={{ color: '#10B981' }} className="font-mono">total</span>
            <span style={{ color: '#94A3B8' }}>acumulado</span>
          </div>
        </div>

        <div className="card metric m3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)' }}>
            <Home className="w-5 h-5" style={{ color: '#F59E0B' }} />
          </div>
          <div className="mt-4 text-3xl font-bold tracking-tight">{fmt(totalRooms)}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#94A3B8' }}>Salas creadas</div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3" style={{ color: '#10B981' }} />
            <span style={{ color: '#10B981' }} className="font-mono">total</span>
            <span style={{ color: '#94A3B8' }}>en el hotel</span>
          </div>
        </div>

        <div className="card metric m4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)' }}>
            <Coins className="w-5 h-5" style={{ color: '#F59E0B' }} />
          </div>
          <div className="mt-4 text-3xl font-bold tracking-tight">{fmt(totalCredits)}</div>
          <div className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#94A3B8' }}>Créditos en circulación</div>
          <div className="mt-3 flex items-center gap-1 text-xs">
            <TrendingDown className="w-3 h-3" style={{ color: '#EF4444' }} />
            <span style={{ color: '#EF4444' }} className="font-mono">economía</span>
            <span style={{ color: '#94A3B8' }}>del hotel</span>
          </div>
        </div>
      </div>

      {/* Chart + Activity */}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        {/* Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-sm font-semibold">Actividad — últimas 24h</div>
              <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Usuarios online por hora</div>
            </div>
            <div className="flex gap-1.5">
              <button className="pill active">24h</button>
              <button className="pill">7d</button>
              <button className="pill">30d</button>
            </div>
          </div>
          <div className="mt-5 relative">
            <div className="sparkbars">
              {CHART_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  style={{
                    height: `${h}%`,
                    background: i === 14
                      ? 'linear-gradient(180deg,#F59E0B,#7C3AED)'
                      : 'linear-gradient(180deg,#00D4AA,#0F766E)',
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-x-0 top-0 grid grid-cols-4 text-[10px] font-mono -mt-4" style={{ color: 'rgba(148,163,184,.6)' }}>
              <div />
              <div className="text-center">06:00</div>
              <div className="text-center">12:00</div>
              <div className="text-right">18:00</div>
            </div>
          </div>
          <div className="mt-4 pt-4 grid grid-cols-3 gap-4 text-xs" style={{ borderTop: '1px solid rgba(51,65,85,.4)' }}>
            <div><div style={{ color: '#94A3B8' }}>Pico</div><div className="font-bold text-lg">{fmt(onlineUsers + 60)}</div><div className="font-mono" style={{ color: '#64748B' }}>estimado</div></div>
            <div><div style={{ color: '#94A3B8' }}>Promedio</div><div className="font-bold text-lg">{fmt(Math.floor(onlineUsers * 0.8))}</div><div style={{ color: '#10B981' }} className="font-mono">activos</div></div>
            <div><div style={{ color: '#94A3B8' }}>Sesión media</div><div className="font-bold text-lg">42m</div><div className="font-mono" style={{ color: '#64748B' }}>por usuario</div></div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Actividad reciente</div>
            <button className="btn btn-ghost text-xs">Ver todo</button>
          </div>
          <ul className="space-y-3">
            {recentLogs.length > 0 ? recentLogs.map(log => (
              <li key={log.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none"
                     style={{ background: 'rgba(0,212,170,.15)', border: '1px solid rgba(0,212,170,.3)', color: '#00D4AA' }}>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm flex-1">
                  <b>{log.user.username}</b> {log.details}
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,.8)' }}>{rel(log.createdAt)}</div>
                </div>
              </li>
            )) : (
              <>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none" style={{ background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#10B981' }}>
                    <UserRound className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm flex-1">
                    Hotel iniciado con éxito
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,.8)' }}>Bienvenido a Kodexa Hotel</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none" style={{ background: 'rgba(124,58,237,.15)', border: '1px solid rgba(124,58,237,.3)', color: '#7C3AED' }}>
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm flex-1">
                    Base de datos inicializada
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,.8)' }}>Schema + seed completado</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none" style={{ background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)', color: '#F59E0B' }}>
                    <Gavel className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm flex-1">
                    Marketplace disponible
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,.8)' }}>Listo para publicar ítems</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none" style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', color: '#EF4444' }}>
                    <Ban className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm flex-1">
                    Sistema de moderación activo
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,.8)' }}>Reportes y bans disponibles</div>
                  </div>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Recent users + Health */}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="text-sm font-semibold">Últimos registros</div>
            <a href="/admin/users" className="btn btn-ghost text-xs">Ver todos →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="kx">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rank</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => {
                  const rk = rankLabel(u.rank);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avt" style={{ background: `linear-gradient(135deg,${COLORS[i % COLORS.length]})` }}>
                            {ini(u.username)}
                          </div>
                          <div className="font-medium">{u.username}</div>
                        </div>
                      </td>
                      <td style={{ color: '#94A3B8' }}>{u.email}</td>
                      <td><span className={`badge ${rk.cls}`}>{rk.label}</span></td>
                      <td className="text-xs font-mono" style={{ color: '#94A3B8' }}>{rel(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Salud del hotel</div>
            <span className="badge badge-ok"><span className="dot" style={{ background: '#10B981' }} /> Todo OK</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'CPU',           val: '24%',           pct: 24,  color: '#10B981' },
              { label: 'Memoria',       val: '3.2 GB / 8 GB', pct: 40,  color: '#00D4AA' },
              { label: 'Latencia',      val: '42 ms',         pct: 15,  color: '#10B981' },
              { label: 'Moderación',    val: `${totalUsers} usuarios`, pct: 35, color: '#F59E0B' },
            ].map(({ label, val, pct, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span style={{ color: '#94A3B8' }}>{label}</span>
                  <span className="font-mono">{val}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,.7)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-outline w-full mt-5 justify-center">
            <Activity className="w-4 h-4" />Ver telemetría completa
          </button>
        </div>
      </div>
    </>
  );
}
