'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Pencil, Trash2, LogIn, X, Save, LockOpen, Lock, KeyRound,
  Star,
} from 'lucide-react';

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
          <Star key={i} className="w-3 h-3" style={{ color: i <= full ? '#F59E0B' : '#334155', fill: i <= full ? '#F59E0B' : 'none' }} />
        ))}
      </div>
      <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>{score}</span>
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
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-xs uppercase font-mono tracking-[.2em]" style={{ color: '#94A3B8' }}>Gestión</div>
          <h1 className="mt-1 text-3xl font-bold">Salas del hotel</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>{rooms.length} salas cargadas.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-2">
        <div className="flex relative items-center flex-1 min-w-[220px]">
          <Search className="w-4 h-4 pointer-events-none absolute" style={{ left: '.7rem', color: '#64748B', zIndex: 1 }} />
          <input
            className="inp"
            style={{ paddingLeft: '2.3rem' }}
            placeholder="Buscar sala por nombre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[['', 'Todas'], ['open', 'Públicas'], ['locked', 'Privadas'], ['password', 'Con contraseña']].map(([val, label]) => (
            <button
              key={val}
              className={`pill${filter === val ? ' active' : ''}`}
              onClick={() => setFilter(val)}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card mt-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="kx">
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
                <tr><td colSpan={7} className="text-center py-12"><div className="spinner mx-auto" /></td></tr>
              ) : rooms.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: '#94A3B8' }}>No se encontraron salas</td></tr>
              ) : rooms.map(r => {
                const pct = Math.min(100, (r.score / 100) * 100);
                return (
                  <tr key={r.id}>
                    <td className="font-mono" style={{ color: '#94A3B8' }}>#{r.id}</td>
                    <td>
                      <div className="font-medium">{r.name}</div>
                      {r.description && <div className="text-xs truncate max-w-[200px]" style={{ color: '#64748B' }}>{r.description}</div>}
                    </td>
                    <td className="hidden md:table-cell" style={{ color: '#94A3B8' }}>@{r.ownerName}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">0/{r.maxUsers}</span>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: 'rgba(15,23,42,.7)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#00D4AA' }} />
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">{stateBadge(r.state)}</td>
                    <td className="hidden lg:table-cell"><Stars score={r.score} /></td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        <button className="icon-btn" title="Entrar"><LogIn className="w-4 h-4" /></button>
                        <button className="icon-btn" title="Editar" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
                        <button className="icon-btn" title="Eliminar" onClick={() => setDeleteRoom(r)} style={{ color: '#f87171' }}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-sm" style={{ borderTop: '1px solid #1f2b41', color: '#94A3B8' }}>
          Mostrando {rooms.length} salas
        </div>
      </div>

      {/* ── MODAL: Edit room ── */}
      {editRoom !== null && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setEditRoom(null); }}>
          <div className="modal p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5" style={{ color: '#00D4AA' }} />Editar sala
              </h3>
              <button className="icon-btn" onClick={() => setEditRoom(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Nombre</label>
                <input className="inp mt-1.5" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Descripción</label>
                <textarea
                  className="inp mt-1.5" rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs uppercase tracking-[.16em] font-mono flex items-center justify-between" style={{ color: '#94A3B8' }}>
                  <span>Aforo máximo</span>
                  <b style={{ color: '#F8FAFC' }}>{capVal}</b>
                </label>
                <input
                  type="range" min={1} max={50} value={capVal}
                  className="w-full mt-2"
                  style={{ accentColor: '#00D4AA' }}
                  onChange={e => setCapVal(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Estado</label>
                <select className="inp mt-1.5" value={editForm.state} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))}>
                  <option value="open">🔓 Pública</option>
                  <option value="locked">🔒 Privada</option>
                  <option value="password">🔑 Contraseña</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Categoría</label>
                <select className="inp mt-1.5" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: Number(e.target.value) }))}>
                  <option value={0}>Charla</option>
                  <option value={1}>Juegos</option>
                  <option value={2}>Casa</option>
                  <option value={3}>Discoteca</option>
                  <option value={4}>Casino</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setEditRoom(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? <div className="spinner" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete confirm ── */}
      {deleteRoom !== null && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteRoom(null); }}>
          <div className="modal p-6" style={{ maxWidth: 420 }}>
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)' }}>
              <Trash2 className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-xl font-bold text-center mt-4">
              ¿Eliminar <span style={{ color: '#EF4444' }}>{deleteRoom.name}</span>?
            </h3>
            <p className="text-sm text-center mt-2" style={{ color: '#94A3B8' }}>
              Se eliminarán todos los ítems dentro de la sala. Acción permanente.
            </p>
            <div className="mt-6 flex gap-2">
              <button className="btn btn-outline flex-1 justify-center" onClick={() => setDeleteRoom(null)}>Cancelar</button>
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
