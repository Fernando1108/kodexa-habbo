'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Search, Trash2, Plus, X, AlertCircle } from 'lucide-react';

interface BanRow {
  id: number;
  username: string;
  ip: string;
  type: string;
  reason: string;
  bannedBy: string;
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

const TYPE_COLORS: Record<string, string> = {
  ban:      '#F59E0B',
  ipban:    '#EF4444',
  superban: '#7C3AED',
};

export default function BansClient({ bans: initialBans, total, page, pages }: {
  bans: BanRow[];
  total: number;
  page: number;
  pages: number;
}) {
  const router = useRouter();
  const [bans, setBans] = useState(initialBans);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', type: 'ban', reason: '', duration: '1d' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const filtered = bans.filter(b =>
    b.username.toLowerCase().includes(search.toLowerCase()) ||
    b.reason.toLowerCase().includes(search.toLowerCase())
  );

  async function submitBan() {
    if (!form.username || !form.reason) { setErr('Usuario y razón son obligatorios'); return; }
    setSaving(true); setErr('');
    const res = await fetch('/api/admin/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? 'Error al banear'); setSaving(false); return; }
    setSaving(false);
    setShowForm(false);
    setForm({ username: '', type: 'ban', reason: '', duration: '1d' });
    router.refresh();
  }

  async function unban(id: number) {
    await fetch(`/api/admin/bans/${id}`, { method: 'DELETE' });
    setBans(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuario o razón…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setErr(''); }}
          className="btn btn-primary py-2.5 px-4 text-sm flex items-center gap-2"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Cancelar' : 'Nuevo ban'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-[#F8FAFC] mb-4 flex items-center gap-2">
            <Ban size={16} className="text-[#EF4444]" /> Banear usuario
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Username</label>
              <input
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="username…"
                className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
              >
                <option value="ban">Ban</option>
                <option value="ipban">IP Ban</option>
                <option value="superban">Super Ban</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">Duración</label>
              <select
                value={form.duration}
                onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
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
              <label className="block text-xs text-[#94A3B8] mb-1.5">Razón</label>
              <input
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="Motivo del ban…"
                className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          {err && (
            <p className="text-xs text-[#EF4444] flex items-center gap-1.5 mb-3">
              <AlertCircle size={12} />{err}
            </p>
          )}
          <button
            onClick={submitBan}
            disabled={saving}
            className="btn btn-primary py-2 px-5 text-sm flex items-center gap-2 disabled:opacity-50"
            style={{ background: '#EF4444', borderColor: '#EF4444' }}
          >
            <Ban size={14} />{saving ? 'Baneando…' : 'Aplicar ban'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#1f2b41] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#0a1224', borderBottom: '1px solid #1f2b41' }}>
              {['Usuario', 'Tipo', 'Razón', 'Por', 'Aplicado', 'Expira', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-[#475569]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2b41]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#475569]">
                  {total === 0 ? 'No hay bans activos 🎉' : 'Sin resultados para tu búsqueda'}
                </td>
              </tr>
            )}
            {filtered.map(ban => (
              <tr key={ban.id} style={{ background: '#0e1627' }}>
                <td className="px-4 py-3 font-mono text-xs text-[#F8FAFC]">{ban.username}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium"
                    style={{ color: TYPE_COLORS[ban.type] ?? '#94A3B8', background: (TYPE_COLORS[ban.type] ?? '#94A3B8') + '18' }}>
                    {ban.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#94A3B8] max-w-xs truncate">{ban.reason}</td>
                <td className="px-4 py-3 text-xs text-[#475569]">{ban.bannedBy}</td>
                <td className="px-4 py-3 text-xs font-mono text-[#475569]">{rel(ban.createdAt)}</td>
                <td className="px-4 py-3 text-xs text-[#475569]">{fmtExpiry(ban.expiresAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => unban(ban.id)}
                    className="p-1.5 rounded-lg text-[#EF4444] hover:bg-red-500/10 transition-colors"
                    title="Desbanear"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#475569]">Página {page} de {pages} · {total} bans activos</span>
          <div className="flex gap-2">
            {page > 1 && <a href={`?page=${page - 1}`} className="btn btn-outline py-1.5 px-4 text-xs">Anterior</a>}
            {page < pages && <a href={`?page=${page + 1}`} className="btn btn-outline py-1.5 px-4 text-xs">Siguiente</a>}
          </div>
        </div>
      )}
    </div>
  );
}
