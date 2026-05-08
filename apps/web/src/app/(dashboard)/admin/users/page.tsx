'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, UserPlus, Pencil, Coins, Trash2,
  AlertCircle, ChevronLeft, ChevronRight, X, Save, Send,
} from 'lucide-react';
import { RANK_LABELS, RANK_COLORS, rankBadgeClass } from '@kodexa/shared';

interface AdminUser {
  id: number; username: string; email: string;
  rank: number; credits: number; online: boolean;
  lastLogin: string; createdAt: string;
}

const COLORS = [
  '#5BFFD7,#7C3AED','#F59E0B,#EF4444','#10B981,#00D4AA',
  '#7C3AED,#F472B6','#3B82F6,#06B6D4','#EF4444,#F59E0B','#34D399,#3B82F6',
];

function ini(s: string) { return s.replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase(); }

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
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [limit,   setLimit]   = useState(10);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [editUser,    setEditUser]    = useState<AdminUser | null>(null);
  const [creditsUser, setCreditsUser] = useState<AdminUser | null>(null);
  const [deleteUser,  setDeleteUser]  = useState<AdminUser | null>(null);

  // Edit form
  const [editForm, setEditForm] = useState({ email: '', rank: 1, credits: 0, motto: '' });
  const [creditsAmount, setCreditsAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({
      page: String(page), limit: String(limit), search,
    });
    const res  = await fetch(`/api/admin/users?${qs}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, limit, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openEdit(u: AdminUser) {
    setEditForm({ email: u.email, rank: u.rank, credits: u.credits, motto: '' });
    setEditUser(u);
    setErr('');
  }

  async function saveEdit() {
    if (!editUser) return;
    setSaving(true); setErr('');
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credits: creditsUser.credits + Number(creditsAmount) }),
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

  const rk = (rank: number) => ({
    label: RANK_LABELS[rank] ?? 'Normal',
    cls:   rankBadgeClass(rank),
    color: RANK_COLORS[rank] ?? '#94A3B8',
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-xs uppercase font-mono tracking-[.2em]" style={{ color: '#94A3B8' }}>Gestión</div>
          <h1 className="mt-1 text-3xl font-bold">
            Usuarios <span className="text-lg font-mono" style={{ color: '#64748B' }}>/ {fmt(total)}</span>
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setEditUser({ id: 0, username: '', email: '', rank: 1, credits: 5000, online: false, lastLogin: '', createdAt: '' })}>
          <UserPlus className="w-4 h-4" />Crear usuario
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <div className="flex relative items-center flex-1 min-w-[220px]">
          <Search className="w-4 h-4 pointer-events-none absolute" style={{ left: '.7rem', color: '#64748B', zIndex: 1 }} />
          <input
            className="inp"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Buscar por username, email o ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="inp w-auto min-w-[140px]" defaultValue="">
          <option value="">Todos los ranks</option>
          {Object.entries(RANK_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <select className="inp w-auto min-w-[140px]" defaultValue="">
          <option value="">Cualquier estado</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <button className="btn btn-outline" onClick={() => { setSearch(''); setPage(1); }}>Limpiar</button>
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
                  <td colSpan={7} className="text-center py-12" style={{ color: '#94A3B8' }}>
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm" style={{ color: '#94A3B8' }}>
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : users.map((u, i) => {
                const rank = rk(u.rank);
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avt" style={{ background: `linear-gradient(135deg,${COLORS[i % COLORS.length]})` }}>{ini(u.username)}</div>
                        <div className="font-medium">{u.username}</div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell" style={{ color: '#94A3B8' }}>{u.email}</td>
                    <td><span className={`badge ${rank.cls}`}>{rank.label}</span></td>
                    <td className="hidden lg:table-cell font-mono">
                      <span style={{ color: '#F59E0B' }}>{fmt(u.credits)}</span>{' '}
                      <span className="text-xs" style={{ color: '#94A3B8' }}>c</span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="dot" style={{ background: u.online ? '#10B981' : '#64748B' }} />
                        <span className="text-xs font-medium" style={{ color: u.online ? '#10B981' : '#94A3B8' }}>
                          {u.online ? 'Online' : 'Offline'}
                        </span>
                      </span>
                    </td>
                    <td className="hidden lg:table-cell text-xs font-mono" style={{ color: '#94A3B8' }}>
                      {u.lastLogin ? rel(u.lastLogin) : '—'}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        <button className="icon-btn" title="Editar" onClick={() => openEdit(u)}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="icon-btn" title="Créditos" onClick={() => { setCreditsUser(u); setErr(''); }}>
                          <Coins className="w-4 h-4" />
                        </button>
                        <button className="icon-btn" title="Eliminar" onClick={() => setDeleteUser(u)} style={{ color: '#f87171' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-sm" style={{ borderTop: '1px solid #1f2b41' }}>
          <div style={{ color: '#94A3B8' }}>
            Mostrando <b style={{ color: '#F8FAFC' }}>{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</b> de <b style={{ color: '#F8FAFC' }}>{fmt(total)}</b>
          </div>
          <div className="flex items-center gap-2">
            <select className="inp w-auto" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10 / página</option>
              <option value={25}>25 / página</option>
              <option value={50}>50 / página</option>
            </select>
            <div className="flex gap-1">
              <button className="icon-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ opacity: page <= 1 ? .4 : 1 }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n} className="icon-btn" onClick={() => setPage(n)}
                    style={page === n ? { background: 'rgba(0,212,170,.15)', color: '#5BFFD7' } : undefined}
                  >{n}</button>
                );
              })}
              {pages > 5 && <span className="px-2 text-xs" style={{ color: '#94A3B8' }}>…</span>}
              <button className="icon-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={{ opacity: page >= pages ? .4 : 1 }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: Edit user ── */}
      {editUser !== null && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setEditUser(null); }}>
          <div className="modal p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase font-mono tracking-[.18em]" style={{ color: '#94A3B8' }}>Gestión de usuario</div>
                <h3 className="text-xl font-bold mt-1">Editar usuario</h3>
              </div>
              <button className="icon-btn" onClick={() => setEditUser(null)}><X className="w-5 h-5" /></button>
            </div>
            {editUser.username && (
              <div className="mt-5 flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(15,23,42,.4)', border: '1px solid #1f2b41' }}>
                <div className="avt" style={{ width: 42, height: 42, fontSize: '1rem', background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
                  {ini(editUser.username)}
                </div>
                <div>
                  <div className="font-semibold">{editUser.username}</div>
                  <div className="text-xs font-mono" style={{ color: '#94A3B8' }}>id #{editUser.id}</div>
                </div>
                <span className={`badge ${rk(editUser.rank).cls} ml-auto`}>{rk(editUser.rank).label}</span>
              </div>
            )}
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Email</label>
                <input className="inp mt-1.5" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Rank</label>
                <select className="inp mt-1.5" value={editForm.rank} onChange={e => setEditForm(f => ({ ...f, rank: Number(e.target.value) }))}>
                  {Object.entries(RANK_LABELS).map(([v, label]) => (
                    <option key={v} value={Number(v)}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Créditos</label>
                <input className="inp mt-1.5" type="number" min={0} value={editForm.credits} onChange={e => setEditForm(f => ({ ...f, credits: Number(e.target.value) }))} />
              </div>
            </div>
            {err && <div className="mt-3 text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertCircle className="w-3 h-3" />{err}</div>}
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
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setCreditsUser(null); }}>
          <div className="modal p-6" style={{ maxWidth: 420 }}>
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Coins className="w-5 h-5" style={{ color: '#F59E0B' }} />Dar créditos
              </h3>
              <button className="icon-btn" onClick={() => setCreditsUser(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
              Otorga moneda a <b style={{ color: '#F8FAFC' }}>{creditsUser.username}</b>.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Cantidad</label>
                <input className="inp mt-1.5" type="number" min={1} placeholder="0" value={creditsAmount} onChange={e => setCreditsAmount(e.target.value)} />
              </div>
            </div>
            {err && <div className="mt-3 text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertCircle className="w-3 h-3" />{err}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setCreditsUser(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveCredits} disabled={saving || !creditsAmount}>
                {saving ? <div className="spinner" /> : <Send className="w-4 h-4" />}
                Otorgar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete confirm ── */}
      {deleteUser !== null && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteUser(null); }}>
          <div className="modal p-6" style={{ maxWidth: 420 }}>
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)' }}>
              <Trash2 className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-xl font-bold text-center mt-4">
              ¿Eliminar a <span style={{ color: '#EF4444' }}>{deleteUser.username}</span>?
            </h3>
            <p className="text-sm text-center mt-2" style={{ color: '#94A3B8' }}>
              Acción <b style={{ color: '#F8FAFC' }}>permanente</b>. Se borrarán todos sus datos.
            </p>
            <div className="mt-6 flex gap-2">
              <button className="btn btn-outline flex-1 justify-center" onClick={() => setDeleteUser(null)}>Cancelar</button>
              <button className="btn btn-danger flex-1 justify-center" onClick={confirmDelete} disabled={saving}>
                {saving ? <div className="spinner" /> : <Trash2 className="w-4 h-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
