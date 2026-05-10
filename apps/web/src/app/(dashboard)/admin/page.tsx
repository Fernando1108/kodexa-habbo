import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import {
  UsersRound, UserPlus, Home, Newspaper,
  Activity, Terminal, Settings,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { RANK_LABELS, rankBadgeClass } from '@kodexa/shared';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard }   from '@/components/admin/AdminStatCard';
import { EmptyState }      from '@/components/admin/EmptyState';

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
  '#5BFFD7,#7C3AED', '#F59E0B,#EF4444', '#10B981,#00D4AA',
  '#7C3AED,#F472B6', '#3B82F6,#06B6D4',
];

function ini(s: string) { return s.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase(); }

const QUICK_ACTIONS = [
  { label: 'Usuarios',      href: '/admin/users',    Icon: UsersRound, desc: 'Gestionar cuentas'   },
  { label: 'Noticias',      href: '/admin/news',     Icon: Newspaper,  desc: 'Publicar contenido'  },
  { label: 'Logs',          href: '/admin/logs',     Icon: Terminal,   desc: 'Ver actividad'       },
  { label: 'Configuración', href: '/admin/settings', Icon: Settings,   desc: 'Ajustes del hotel'   },
] as const;

const SYSTEM_STATUS = [
  { label: 'CMS Web',       status: true,  note: 'Next.js 15 activo'        },
  { label: 'Autenticación', status: true,  note: 'NextAuth v5 activo'       },
  { label: 'Base de datos', status: true,  note: 'MariaDB + Prisma activo'  },
  { label: 'Emulador',      status: false, note: 'Pendiente de configurar'  },
] as const;

export default async function AdminPage() {
  const session  = await auth();
  const username = session?.user?.username ?? 'Admin';

  const [onlineUsers, totalUsers, totalRooms, totalNews, recentUsers, recentLogs] = await Promise.all([
    prisma.user.count({ where: { online: true } }),
    prisma.user.count(),
    prisma.room.count(),
    prisma.news.count(),
    prisma.user.findMany({
      select:  { id: true, username: true, email: true, rank: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take:    5,
    }),
    prisma.kxActivityLog.findMany({
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take:    5,
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Vista general"
        title={<>Bienvenido, <span className="text-gradient">{username}</span></>}
        subtitle={`${fmt(onlineUsers)} jugador${onlineUsers !== 1 ? 'es' : ''} online ahora mismo`}
        actions={
          <Link href="/admin/logs" className="btn btn-outline">
            <Activity className="w-4 h-4" />Ver logs
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AdminStatCard
          icon={<UsersRound className="w-5 h-5" />}
          iconColor="primary"
          value={fmt(onlineUsers)}
          label="Usuarios online"
          trend={{ direction: 'up', label: 'activos ahora' }}
          live
        />
        <AdminStatCard
          icon={<UserPlus className="w-5 h-5" />}
          iconColor="purple"
          value={fmt(totalUsers)}
          label="Registrados"
          trend={{ direction: 'neutral', label: 'total acumulado' }}
        />
        <AdminStatCard
          icon={<Home className="w-5 h-5" />}
          iconColor="amber"
          value={fmt(totalRooms)}
          label="Salas creadas"
          trend={{ direction: 'neutral', label: 'en el hotel' }}
        />
        <AdminStatCard
          icon={<Newspaper className="w-5 h-5" />}
          iconColor="green"
          value={fmt(totalNews)}
          label="Noticias publicadas"
          trend={{ direction: 'neutral', label: 'total' }}
        />
      </div>

      {/* Quick actions + Activity feed */}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-4">

        {/* Quick actions */}
        <div className="card p-5">
          <div className="text-sm font-semibold mb-4" style={{ color: 'var(--admin-text)' }}>
            Acciones rápidas
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(({ label, href, Icon, desc }) => (
              <Link key={href} href={href} className="admin-quick-action">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: 'var(--admin-primary-bg)', color: 'var(--admin-primary)' }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--admin-text)' }}>{label}</div>
                <div className="text-xs mt-0.5"      style={{ color: 'var(--admin-text-muted)' }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>
              Actividad reciente
            </div>
            <Link href="/admin/logs" className="btn btn-ghost text-xs">Ver todo</Link>
          </div>

          {recentLogs.length === 0 ? (
            <EmptyState
              icon={<Activity className="w-6 h-6" />}
              title="Sin actividad aún"
              description="Los logs aparecerán aquí cuando los usuarios interactúen con el hotel."
            />
          ) : (
            <ul className="space-y-3">
              {recentLogs.map(log => (
                <li key={log.id} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-none"
                    style={{
                      background: 'var(--admin-primary-bg)',
                      border:     '1px solid rgba(0,212,170,.2)',
                      color:      'var(--admin-primary)',
                    }}
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-sm flex-1 min-w-0">
                    <b style={{ color: 'var(--admin-text)' }}>{log.user.username}</b>
                    <span style={{ color: 'var(--admin-text-muted)' }}> {log.details}</span>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-subtle)' }}>
                      {rel(log.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent users + System overview */}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">

        {/* Recent users table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>
              Últimos registros
            </div>
            <Link href="/admin/users" className="btn btn-ghost text-xs">Ver todos →</Link>
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
                          <div
                            className="avt"
                            style={{ background: `linear-gradient(135deg,${COLORS[i % COLORS.length]})` }}
                          >
                            {ini(u.username)}
                          </div>
                          <div className="font-medium" style={{ color: 'var(--admin-text)' }}>
                            {u.username}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{u.email}</td>
                      <td><span className={`badge ${rk.cls}`}>{rk.label}</span></td>
                      <td className="text-xs font-mono" style={{ color: 'var(--admin-text-muted)' }}>
                        {rel(u.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* System overview */}
        <div className="card p-5">
          <div className="text-sm font-semibold mb-4" style={{ color: 'var(--admin-text)' }}>
            Estado del sistema
          </div>
          <div className="space-y-3">
            {SYSTEM_STATUS.map(({ label, status, note }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex-none">
                  {status
                    ? <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                    : <XCircle      className="w-4 h-4" style={{ color: 'var(--admin-text-subtle)' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm"    style={{ color: 'var(--admin-text)' }}>{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>{note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
