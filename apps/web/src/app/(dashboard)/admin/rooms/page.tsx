'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Pencil, Trash2, LogIn, X, Save, LockOpen, Lock, KeyRound,
  Star, DoorOpen,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { EmptyState }      from '@/components/admin/EmptyState';
import { ConfirmModal }    from '@/components/admin/ConfirmModal';

interface AdminRoom {
  id: number; name: string; ownerName: string;
  maxUsers: number; score: number; state: string;
  category: number; description: string;
}

interface EditForm {
  name: string; description: string;
  maxUsers: number; state: string; category: number;
}

function stateBadge(state: string) {
  if (state === 'open')     return <span className="badge badge-ok"><LockOpen className="w-3 h-3" />Pública</span>;
  if (state === 'password') return <span className="badge badge-warn"><KeyRound className="w-3 h-3" />Contraseña</span>;
  return                           <span className="badge badge-mono"><Lock className="w-3 h-3" />Privada</span>;
}

function Stars({ score }: { score: number }) {
  const full = Math.min(5, Math.floor(score / 20));
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star
            key={i}
            className="w-3 h-3"
            style={{
              color: i <= full ? 'var(--admin-warning)' : 'var(--admin-border)',
              fill:  i <= full ? 'var(--admin-warning)' : 'none',
            }}
          />
        ))}
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--admin-text-subtle)' }}>{score}</span>
    </div>
  );
}

export default function RoomsPage() {
  const [rooms,   setRooms]   = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('');

  const [editRoom,   setEditRoom]   = useState<AdminRoom | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<AdminRoom | null>(null);
  const [editForm,   setEditForm]   = useState<EditForm>({ name: '', description: '', maxUsers: 25, state: 'open', category: 0 });
  const [saving,     setSaving]     = useState(false);
  const [capVal,     setCapVal]     = useState(25);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const qs  = new URLSearchParams({ search, ...(filter ? { state: filter } : {}) });
    const res = await fetch(`/api/admin/rooms?${qs}`);
    const data = await res.json();
    setRooms(data.rooms ?? []);
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  function openEdit(r: AdminRoom) {
    setEditForm({ name: r.name, description: r.description, maxUsers: r.maxUsers, state: r.state, category: r.category });
    setCapVal(r.maxUsers);
    setEditRoom(r);
  }

  async function saveEdit() {
    if (!editRoom) return;
    setSaving(true);
    await fetch(`/api/admin/rooms/${editRoom.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, maxUsers: capVal }),
    });
    setSaving(false);
    setEditRoom(null);
    fetchRooms();
  }

  async function confirmDelete() {
    if (!deleteRoom) return;
    setSaving(true);
    await fetch(`/api/admin/rooms/${deleteRoom.id}`, { method: 'DELETE' });
    setSaving(false);
    setDeleteRoom(null);
    fetchRooms();
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Hotel"
        title="Salas del hotel"
        subtitle={loading ? 'Cargando salas…' : `${rooms.length} ${rooms.length === 1 ? 'sala cargada' : 'salas cargadas'}`}
      />

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-2 mb-3">
        <div className="flex relative items-center flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 pointer-events-none absolute"
            style={{ left: '.7rem', color: 'var(--admin-text-subtle)', zIndex: 1 }}
          />
          <input
            className="inp"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Buscar sala por nombre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([['', 'Todas'], ['open', 'Públicas'], ['locked', 'Privadas'], ['password', 'Con contraseña']] as const).map(([val, label]) => (
            <button
              key={val}
              className={`pill${filter === val ? ' active' : ''}`}
              onClick={() => setFilter(val)}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="kx w-full">
            <thead>
              <tr>
                <th className="w-12">ID</th>
                <th>Sala</th>
                <th className="hidden md:table-cell">Dueño</th>
                <th>Aforo</th>
                <th className="hidden lg:table-cell">Estado</th>
                <th className="hidden lg:table-cell">Score</th>
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
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={<DoorOpen className="w-8 h-8" />}
                      title="No se encontraron salas"
                      description={filter || search ? 'Prueba con otros filtros de búsqueda.' : 'Aún no hay salas en el hotel.'}
                    />
                  </td>
                </tr>
              ) : rooms.map(r => {
                const pct = Math.min(100, r.score);
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                      #{r.id}
                    </td>
                    <td>
                      <div className="font-medium" style={{ color: 'var(--admin-text)' }}>{r.name}</div>
                      {r.description && (
                        <div className="text-xs truncate max-w-[200px]" style={{ color: 'var(--admin-text-subtle)' }}>
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td className="hidden md:table-cell text-xs font-mono" style={{ color: 'var(--admin-text-subtle)' }}>
                      @{r.ownerName}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                          0/{r.maxUsers}
                        </span>
                        <div
                          className="w-16 h-1.5 rounded-full overflow-hidden hidden sm:block"
                          style={{ background: 'var(--admin-surface-soft)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: pct > 80
                                ? 'var(--admin-danger)'
                                : pct > 50
                                  ? 'var(--admin-warning)'
                                  : 'var(--admin-primary)',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">{stateBadge(r.state)}</td>
                    <td className="hidden lg:table-cell"><Stars score={r.score} /></td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        <button className="icon-btn" title="Entrar">
                          <LogIn className="w-4 h-4" />
                        </button>
                        <button className="icon-btn" title="Editar" onClick={() => openEdit(r)}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="icon-btn"
                          title="Eliminar"
                          onClick={() => setDeleteRoom(r)}
                          style={{ color: 'var(--admin-danger)' }}
                        >
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
        <div
          className="px-4 py-3 text-sm"
          style={{ borderTop: '1px solid var(--admin-border)', color: 'var(--admin-text-subtle)' }}
        >
          Mostrando {rooms.length} {rooms.length === 1 ? 'sala' : 'salas'}
        </div>
      </div>

      {/* ── MODAL: Edit room ── */}
      {editRoom !== null && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setEditRoom(null); }}>
          <div className="modal p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" style={{ color: 'var(--admin-primary)' }} />
                Editar sala
              </h3>
              <button className="icon-btn" onClick={() => setEditRoom(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="admin-eyebrow block mb-1.5">Nombre</label>
                <input
                  className="inp"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="admin-eyebrow block mb-1.5">Descripción</label>
                <textarea
                  className="inp"
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="admin-eyebrow flex items-center justify-between mb-2">
                  <span>Aforo máximo</span>
                  <b style={{ color: 'var(--admin-text)' }}>{capVal}</b>
                </label>
                <input
                  type="range" min={1} max={50} value={capVal}
                  className="w-full"
                  style={{ accentColor: 'var(--admin-primary)' }}
                  onChange={e => setCapVal(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="admin-eyebrow block mb-1.5">Estado</label>
                <select
                  className="inp"
                  value={editForm.state}
                  onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))}
                >
                  <option value="open">Pública</option>
                  <option value="locked">Privada</option>
                  <option value="password">Contraseña</option>
                </select>
              </div>
              <div>
                <label className="admin-eyebrow block mb-1.5">Categoría</label>
                <select
                  className="inp"
                  value={editForm.category}
                  onChange={e => setEditForm(f => ({ ...f, category: Number(e.target.value) }))}
                >
                  <option value={0}>Charla</option>
                  <option value={1}>Juegos</option>
                  <option value={2}>Casa</option>
                  <option value={3}>Discoteca</option>
                  <option value={4}>Casino</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setEditRoom(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? <div className="spinner" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete confirm ── */}
      <ConfirmModal
        open={deleteRoom !== null}
        onClose={() => setDeleteRoom(null)}
        onConfirm={confirmDelete}
        title={`¿Eliminar "${deleteRoom?.name}"?`}
        description="Se eliminarán todos los ítems dentro de la sala. Esta acción es permanente."
        variant="danger"
        loading={saving}
        confirmLabel="Eliminar"
      />
    </>
  );
}
