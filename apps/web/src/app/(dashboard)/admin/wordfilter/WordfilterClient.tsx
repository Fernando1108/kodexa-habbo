'use client';

import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';

interface WordRow { id: number; word: string; replacement: string; type: string }

export default function WordfilterClient({ initialWords }: { initialWords: WordRow[] }) {
  const [words, setWords] = useState(initialWords);
  const [search, setSearch] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newReplace, setNewReplace] = useState('****');
  const [newType, setNewType] = useState('block');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const filtered = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase())
  );

  async function addWord() {
    if (!newWord.trim()) { setErr('Escribe una palabra'); return; }
    if (words.some(w => w.word === newWord.trim().toLowerCase())) {
      setErr('Esa palabra ya existe');
      return;
    }
    setSaving(true); setErr('');
    const res = await fetch('/api/admin/wordfilter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: newWord.trim().toLowerCase(), replacement: newReplace || '****', type: newType }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? 'Error'); setSaving(false); return; }
    setWords(prev => [...prev, data].sort((a, b) => a.word.localeCompare(b.word)));
    setNewWord('');
    setNewReplace('****');
    setSaving(false);
  }

  async function removeWord(id: number) {
    await fetch(`/api/admin/wordfilter/${id}`, { method: 'DELETE' });
    setWords(prev => prev.filter(w => w.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Add form — full row, no collapse */}
      <div className="card">
        <h2 className="font-semibold text-[#F8FAFC] mb-4">Añadir palabra</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div style={{ minWidth: 160 }}>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Palabra</label>
            <input
              value={newWord}
              onChange={e => { setNewWord(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && addWord()}
              placeholder="palabra a filtrar"
              className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
            />
          </div>
          <div style={{ minWidth: 120 }}>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Reemplazo</label>
            <input
              value={newReplace}
              onChange={e => setNewReplace(e.target.value)}
              placeholder="****"
              className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Tipo</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
            >
              <option value="block">Bloquear mensaje</option>
              <option value="replace">Reemplazar palabra</option>
            </select>
          </div>
          <button
            onClick={addWord}
            disabled={saving}
            className="btn btn-primary py-2.5 px-5 text-sm flex items-center gap-2 flex-none disabled:opacity-50"
          >
            <Plus size={14} />{saving ? 'Añadiendo…' : 'Añadir'}
          </button>
        </div>
        {err && <p className="text-xs text-[#EF4444] mt-2">{err}</p>}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar palabra…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1f2b41] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#0a1224', borderBottom: '1px solid #1f2b41' }}>
              <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-[#475569] w-1/3">Palabra</th>
              <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-[#475569] w-1/4">Reemplazo</th>
              <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-[#475569]">Tipo</th>
              <th className="px-5 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2b41]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-[#475569]">
                  {words.length === 0 ? 'No hay palabras filtradas' : 'Sin resultados'}
                </td>
              </tr>
            )}
            {filtered.map(w => (
              <tr key={w.id} style={{ background: '#0e1627' }}>
                <td className="px-5 py-3 font-mono text-sm text-[#F8FAFC]">{w.word}</td>
                <td className="px-5 py-3 font-mono text-sm text-[#94A3B8]">{w.replacement}</td>
                <td className="px-5 py-3">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium"
                    style={{
                      color:      w.type === 'block' ? '#EF4444' : '#F59E0B',
                      background: w.type === 'block' ? '#EF444418' : '#F59E0B18',
                    }}
                  >
                    {w.type === 'block' ? 'bloquear' : 'reemplazar'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => removeWord(w.id)}
                    className="p-1.5 rounded-lg text-[#EF4444] hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#334155]">{filtered.length} de {words.length} palabras</p>
    </div>
  );
}
