'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Pencil, Coins, Trash2,
  AlertCircle, ChevronLeft, ChevronRight, X, Save, Send,
} from 'lucide-react';
import { RANK_LABELS } from '@kodexa/shared';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { RankBadge }       from '@/components/admin/RankBadge';
import { ConfirmModal }    from '@/components/admin/ConfirmModal';
import { EmptyState }      from '@/components/admin/EmptyState';

interface AdminUser {
  id:        number;
  username:  string;
  email:     string;
  rank:      number;
  credits:   number;
  online:    boolean;
  lastLogin: string;
  createdAt: string;
}

const COLORS = [
  '#5BFFD7,#7C3AED', '#F59E0B,#EF4444', '#10B981,#00D4AA',
  '#7C3AED,#F472B6', '#3B82F6,#06B6D4', '#EF4444,#F59E0B', '#34D399,#3B82F6',
];

function ini(s: string) { return s.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase(); }

function rel(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'ahora';
  if (mins  < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

function fmt(n: number) { return n.toLocaleString('es-ES'); }

export default function UsersPage() {
  const [users,        setUsers]        = useState<AdminUser[]>([]);
  const [total,        setTotal]        = useState(0);
  const [pages,        setPages]        = useState(1);
  const [page,         setPage]         = useState(1);
  const [limit,        setLimit]        = useState(10);
  const [search,       setSearch]       = useState('');
  const [rankFilter,   setRankFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading,      setLoading]      = useState(true);

  // Modals
  const [editUser,    setEditUser]    = useState<AdminUser | null>(null);
  const [creditsUser, setCreditsUser] = useState<AdminUser | null>(null);
  const [deleteUser,  setDeleteUser]  = useState<AdminUser | null>(null);

  // Edit form
  const [editForm,      setEditForm]      = useState({ email: '', rank: 1, credits: 0 });
  const [creditsAmount, setCreditsAmount] = useState('');
  const [saving,        setSaving]        = useState(false);
  const [err,           setErr]           = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: String(limit), search });
    if (rankFilter)   qs.set('rank',   rankFilter);
    if (statusFilter) qs.set('status', statusFilter);
    const res  = await fetch(`/api/admin/users?${qs}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, limit, search, rankFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openEdit(u: AdminUser) {
    setEditForm({ email: u.email, rank: u.rank, credits: u.credits });
    setEditUser(u);
    setErr('');
  }

  async function saveEdit() {
    if (!editUser) return;
    setSaving(true); setErr('');
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(editForm),
    });
    setSaving(false);
    if (!res.ok) { setErr('Error al guardar'); return; }
    setEditUser(null);
    fetchUsers();
  }

  async function saveCredits() {
    if (!creditsUser || !creditsAmount) return;
    setSaving(true); setErr('');
    const res = await fetch(`/api/admin/users/${creditsUser.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ credits: creditsUser.credits + Number(creditsAmount) }),
    });
    setSaving(false);
    if (!res.ok) { setErr('Error al otorgar créditos'); return; }
    setCreditsUser(null);
    setCreditsAmount('');
    fetchUsers();
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    setSaving(true);
    await fetch(`/api/admin/users/${deleteUser.id}`, { method: 'DELETE' });
    setSaving(false);
    setDeleteUser(null);
    fetchUsers();
  }

  function clearFilters() {
    setSearch('');
    setRankFilter('');
    setStatusFilter('');
    setPage(1);
  }

  // Windowed page range (±2 from current)
  const pageRange = (() => {
    const start = Math.max(1, page - 2);
    const end   = Math.min(pages, page + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const hasFilters = search || rankFilter || statusFilter;

  return (
    <>
      <AdminPageHeader
        eyebrow="Housekeeping"
        title={
          <>
            Gestión de usuarios{' '}
            <span className="text-lg font-mono" style={{ color: 'var(--admin-text-subtle)' }}>
              / {fmt(total)}
            </span>
          </>
        }
        subtitle="Consulta, edita y modera las cuentas del hotel"
      />

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <div className="flex relative items-center flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 pointer-events-none absolute"
            style={{ left: '.7rem', color: 'var(--admin-text-subtle)', zIndex: 1 }}
          />
          <input
            className="inp"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Buscar por username, email o ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="inp w-auto min-w-[140px]"
          value={rankFilter}
          onChange={e => { setRankFilter(e.target.value); setPage(1); }}
        >
          <option value="">Todos los ranks</option>
          {Object.entries(RANK_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <select
          className="inp w-auto min-w-[140px]"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">Cualquier estado</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        {hasFilters && (
          <button className="btn btn-outline" onClick={clearFilters}>Limpiar</button>
        )}
      </div>

      {/* Table */}
      <div className="card mt-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="kx">
            <thead>
              <tr>
                <th>Usuario</th>
                <th className="hidden md:table-cell">Email</th>
                <th>Rank</th>
                <th className="hidden lg:table-cell">Créditos</th>
                <th>Estado</th>
                <th className="hidden lg:table-cell">Último acceso</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No se encontraron usuarios"
                      description={
                        hasFilters
                          ? 'Prueba con otros filtros.'
                          : 'Aún no hay usuarios registrados.'
                      }
                    />
                  </td>
                </tr>
              ) : users.map((u, i) => (
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
                  <td className="hidden md:table-cell" style={{ color: 'var(--admin-text-muted)' }}>
                    {u.email}
                  </td>
                  <td>
                    <RankBadge rank={u.rank} />
                  </td>
                  <td className="hidden lg:table-cell font-mono">
                    <span style={{ color: 'var(--admin-warning)' }}>{fmt(u.credits)}</span>{' '}
                    <span className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>c</span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="dot"
                        style={{ background: u.online ? 'var(--admin-success)' : 'var(--admin-text-subtle)' }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: u.online ? 'var(--admin-success)' : 'var(--admin-text-muted)' }}
                      >
                        {u.online ? 'Online' : 'Offline'}
                      </span>
                    </span>
                  </td>
                  <td className="hidden lg:table-cell text-xs font-mono" style={{ color: 'var(--admin-text-muted)' }}>
                    {u.lastLogin ? rel(u.lastLogin) : '—'}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-0.5">
                      <button className="icon-btn" title="Editar" onClick={() => openEdit(u)}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="icon-btn"
                        title="Dar créditos"
                        onClick={() => { setCreditsUser(u); setErr(''); }}
                      >
                        <Coins className="w-4 h-4" />
                      </button>
                      <button
                        className="icon-btn"
                        title="Eliminar"
                        onClick={() => setDeleteUser(u)}
                        style={{ color: 'var(--admin-danger)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div
            className="px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-sm"
            style={{ borderTop: '1px solid var(--admin-border)' }}
          >
            <div style={{ color: 'var(--admin-text-muted)' }}>
              Mostrando{' '}
              <b style={{ color: 'var(--admin-text)' }}>{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</b>
              {' '}de{' '}
              <b style={{ color: 'var(--admin-text)' }}>{fmt(total)}</b>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="inp w-auto"
                value={limit}
                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              >
                <option value={10}>10 / página</option>
                <option value={25}>25 / página</option>
                <option value={50}>50 / página</option>
              </select>
              <div className="flex gap-1">
                <button
                  className="icon-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ opacity: page <= 1 ? .4 : 1 }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageRange.map(n => (
                  <button
                    key={n}
                    className="icon-btn"
                    onClick={() => setPage(n)}
                    style={page === n
                      ? { background: 'var(--admin-primary-bg)', color: 'var(--admin-nav-active-color)' }
                      : undefined}
                  >{n}</button>
                ))}
                {pages > pageRange[pageRange.length - 1] && (
                  <span className="px-2 text-xs" style={{ color: 'var(--admin-text-muted)' }}>…</span>
                )}
                <button
                  className="icon-btn"
                  disabled={page >= pages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ opacity: page >= pages ? .4 : 1 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: Edit user ── */}
      {editUser !== null && (
        <div
          className="overlay"
          onClick={e => { if (e.target === e.currentTarget) setEditUser(null); }}
        >
          <div className="modal p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="admin-eyebrow">Gestión de usuario</div>
                <h3 className="text-xl font-bold mt-1" style={{ color: 'var(--admin-text)' }}>
                  Editar usuario
                </h3>
              </div>
              <button className="icon-btn" onClick={() => setEditUser(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {editUser.username && (
              <div
                className="mt-5 flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--admin-surface-soft)', border: '1px solid var(--admin-border)' }}
              >
                <div
                  className="avt"
                  style={{ width: 42, height: 42, fontSize: '1rem', background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}
                >
                  {ini(editUser.username)}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--admin-text)' }}>
                    {editUser.username}
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--admin-text-muted)' }}>
                    id #{editUser.id}
                  </div>
                </div>
                <RankBadge rank={editUser.rank} className="ml-auto" />
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="admin-eyebrow block mb-1.5">Email</label>
                <input
                  className="inp"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="admin-eyebrow block mb-1.5">Rank</label>
                <select
                  className="inp"
                  value={editForm.rank}
                  onChange={e => setEditForm(f => ({ ...f, rank: Number(e.target.value) }))}
                >
                  {Object.entries(RANK_LABELS).map(([v, label]) => (
                    <option key={v} value={Number(v)}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-eyebrow block mb-1.5">Créditos</label>
                <input
                  className="inp"
                  type="number"
                  min={0}
                  value={editForm.credits}
                  onChange={e => setEditForm(f => ({ ...f, credits: Number(e.target.value) }))}
                />
              </div>
            </div>

            {err && (
              <div className="mt-3 text-xs flex items-center gap-1.5" style={{ color: 'var(--admin-danger)' }}>
                <AlertCircle className="w-3 h-3" />{err}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setEditUser(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? <div className="spinner" /> : <Save className="w-4 h-4" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Give credits ── */}
      {creditsUser !== null && (
        <div
          className="overlay"
          onClick={e => { if (e.target === e.currentTarget) setCreditsUser(null); }}
        >
          <div className="modal p-6" style={{ maxWidth: 420 }}>
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                <Coins className="w-5 h-5" style={{ color: 'var(--admin-warning)' }} />
                Dar créditos
              </h3>
              <button className="icon-btn" onClick={() => setCreditsUser(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--admin-text-muted)' }}>
              Otorga moneda a{' '}
              <b style={{ color: 'var(--admin-text)' }}>{creditsUser.username}</b>.
            </p>
            <div className="mt-5">
              <label className="admin-eyebrow block mb-1.5">Cantidad</label>
              <input
                className="inp"
                type="number"
                min={1}
                placeholder="0"
                value={creditsAmount}
                onChange={e => setCreditsAmount(e.target.value)}
              />
            </div>
            {err && (
              <div className="mt-3 text-xs flex items-center gap-1.5" style={{ color: 'var(--admin-danger)' }}>
                <AlertCircle className="w-3 h-3" />{err}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setCreditsUser(null)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={saveCredits}
                disabled={saving || !creditsAmount}
              >
                {saving ? <div className="spinner" /> : <Send className="w-4 h-4" />}
                Otorgar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete — ConfirmModal component ── */}
      <ConfirmModal
        open={deleteUser !== null}
        onClose={() => setDeleteUser(null)}
        onConfirm={confirmDelete}
        title={
          <>¿Eliminar a{' '}
            <span style={{ color: 'var(--admin-danger)' }}>{deleteUser?.username}</span>?
          </>
        }
        description={<>Acción <b>permanente</b>. Se borrarán todos sus datos.</>}
        variant="danger"
        loading={saving}
        confirmLabel="Eliminar"
      />
    </>
  );
}
