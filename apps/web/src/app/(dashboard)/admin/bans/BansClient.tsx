'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Search, Trash2, Plus, X, AlertCircle, ShieldOff } from 'lucide-react';
import { EmptyState }   from '@/components/admin/EmptyState';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

interface BanRow {
  id:        number;
  username:  string;
  ip:        string;
  type:      string;
  reason:    string;
  bannedBy:  string;
  expiresAt: string | null;
  createdAt: string;
}

function rel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}m`;
  if (h < 24) return `hace ${h}h`;
  return `hace ${d}d`;
}

function fmtExpiry(iso: string | null) {
  if (!iso) return 'Permanente';
  const d = new Date(iso);
  if (d < new Date()) return 'Expirado';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Map ban type → badge class (token-based, no hex)
function typeBadgeClass(type: string): string {
  if (type === 'ipban')    return 'badge badge-danger';
  if (type === 'superban') return 'badge badge-info';
  if (type === 'ban')      return 'badge badge-warn';
  return 'badge badge-mono';
}

export default function BansClient({ bans: initialBans, total, page, pages }: {
  bans:  BanRow[];
  total: number;
  page:  number;
  pages: number;
}) {
  const router = useRouter();
  const [bans,        setBans]        = useState(initialBans);
  const [search,      setSearch]      = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ username: '', type: 'ban', reason: '', duration: '1d' });
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [err,         setErr]         = useState('');
  const [unbanTarget, setUnbanTarget] = useState<BanRow | null>(null);

  const filtered = bans.filter(b =>
    b.username.toLowerCase().includes(search.toLowerCase()) ||
    b.reason.toLowerCase().includes(search.toLowerCase())
  );

  async function submitBan() {
    if (!form.username || !form.reason) { setErr('Usuario y razón son obligatorios'); return; }
    setSaving(true); setErr('');
    const res = await fetch('/api/admin/bans', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? 'Error al banear'); setSaving(false); return; }
    setSaving(false);
    setShowForm(false);
    setForm({ username: '', type: 'ban', reason: '', duration: '1d' });
    router.refresh();
  }

  async function confirmUnban() {
    if (!unbanTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/bans/${unbanTarget.id}`, { method: 'DELETE' });
    setDeleting(false);
    setUnbanTarget(null);
    setBans(prev => prev.filter(b => b.id !== unbanTarget.id));
  }

  return (
    <div className="space-y-4">
      {/* Search + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--admin-text-subtle)' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuario o razón…"
            className="inp w-full pl-9"
          />
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setErr(''); }}
          className="btn btn-primary text-sm"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancelar' : 'Nuevo ban'}
        </button>
      </div>

      {/* Ban form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
            <Ban className="w-4 h-4" style={{ color: 'var(--admin-danger)' }} />
            Banear usuario
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="admin-eyebrow block mb-1.5">Username</label>
              <input
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="username…"
                className="inp w-full"
              />
            </div>
            <div>
              <label className="admin-eyebrow block mb-1.5">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="inp w-full"
              >
                <option value="ban">Ban</option>
                <option value="ipban">IP Ban</option>
                <option value="superban">Super Ban</option>
              </select>
            </div>
            <div>
              <label className="admin-eyebrow block mb-1.5">Duración</label>
              <select
                value={form.duration}
                onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                className="inp w-full"
              >
                <option value="1h">1 hora</option>
                <option value="6h">6 horas</option>
                <option value="24h">24 horas</option>
                <option value="7d">7 días</option>
                <option value="30d">30 días</option>
                <option value="perm">Permanente</option>
              </select>
            </div>
            <div>
              <label className="admin-eyebrow block mb-1.5">Razón</label>
              <input
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Motivo del ban…"
                className="inp w-full"
              />
            </div>
          </div>
          {err && (
            <p className="text-xs flex items-center gap-1.5 mb-3" style={{ color: 'var(--admin-danger)' }}>
              <AlertCircle className="w-3 h-3" />{err}
            </p>
          )}
          <button
            onClick={submitBan}
            disabled={saving}
            className="btn btn-danger text-sm disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" />
            {saving ? 'Baneando…' : 'Aplicar ban'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="kx w-full">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>Razón</th>
                <th className="hidden md:table-cell">Por</th>
                <th className="hidden md:table-cell">Aplicado</th>
                <th>Expira</th>
                <th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={<ShieldOff className="w-8 h-8" />}
                      title={total === 0 ? 'Sin baneos activos' : 'Sin resultados para tu búsqueda'}
                      description={total === 0 ? 'El hotel está limpio.' : 'Prueba con otro usuario o razón.'}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(ban => (
                  <tr key={ban.id}>
                    <td className="font-mono text-xs" style={{ color: 'var(--admin-text)' }}>
                      {ban.username}
                    </td>
                    <td>
                      <span className={typeBadgeClass(ban.type)}>{ban.type}</span>
                    </td>
                    <td
                      className="text-xs max-w-xs truncate"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      {ban.reason}
                    </td>
                    <td
                      className="hidden md:table-cell text-xs"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    >
                      {ban.bannedBy}
                    </td>
                    <td
                      className="hidden md:table-cell text-xs font-mono"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    >
                      {rel(ban.createdAt)}
                    </td>
                    <td className="text-xs">
                      {ban.expiresAt === null ? (
                        <span className="badge badge-danger">Permanente</span>
                      ) : new Date(ban.expiresAt) < new Date() ? (
                        <span className="badge badge-mono">Expirado</span>
                      ) : (
                        <span style={{ color: 'var(--admin-text-subtle)' }}>
                          {fmtExpiry(ban.expiresAt)}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setUnbanTarget(ban)}
                        className="icon-btn"
                        title="Desbanear"
                        style={{ color: 'var(--admin-danger)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--admin-text-subtle)' }}>
          <span>Página {page} de {pages} · {total} bans activos</span>
          <div className="flex gap-2">
            {page > 1    && <a href={`?page=${page - 1}`} className="btn btn-outline text-xs py-1.5 px-4">Anterior</a>}
            {page < pages && <a href={`?page=${page + 1}`} className="btn btn-outline text-xs py-1.5 px-4">Siguiente</a>}
          </div>
        </div>
      )}

      {/* Unban confirmation */}
      <ConfirmModal
        open={unbanTarget !== null}
        onClose={() => setUnbanTarget(null)}
        onConfirm={confirmUnban}
        title={`¿Desbanear a "${unbanTarget?.username}"?`}
        description="El usuario podrá acceder al hotel de nuevo. Esta acción no se puede deshacer."
        variant="danger"
        loading={deleting}
        confirmLabel="Desbanear"
      />
    </div>
  );
}
