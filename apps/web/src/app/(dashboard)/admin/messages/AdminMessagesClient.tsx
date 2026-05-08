'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Trash2, ChevronDown, ChevronUp, Send, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

interface MsgUser { id: number; username: string; rank?: number }
interface MsgRow {
  id: number; body: string; read: boolean; createdAt: string;
  from: MsgUser; to: MsgUser;
  replies?: MsgRow[];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}m`;
  if (h < 24) return `hace ${h}h`;
  return `hace ${d}d`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ThreadModal({ thread, onClose }: { thread: MsgRow; onClose: () => void }) {
  const allMessages = [thread, ...(thread.replies ?? [])];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ background: 'rgba(0,0,0,.7)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col" style={{ background: '#0e1627', border: '1px solid #1f2b41', maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f2b41' }}>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-[#475569] hover:text-[#94A3B8] mr-1">
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-sm font-semibold text-[#F8FAFC]">
                <Link href={`/admin/users?q=${thread.from.username}`} className="hover:underline text-primary">{thread.from.username}</Link>
                <span className="mx-1.5 text-[#475569]">→</span>
                <Link href={`/admin/users?q=${thread.to.username}`} className="hover:underline text-primary">{thread.to.username}</Link>
              </p>
              <p className="text-xs text-[#475569]">{allMessages.length} mensaje{allMessages.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-[#94A3B8]"><X size={16} /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {allMessages.map(msg => (
            <div key={msg.id} className="flex gap-3">
              {/* Avatar */}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-none text-xs font-bold"
                   style={{ background: 'linear-gradient(135deg,#00D4AA,#7C3AED)', color: '#fff' }}>
                {msg.from.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/admin/users?q=${msg.from.username}`}
                        className="text-xs font-semibold text-primary hover:underline">
                    {msg.from.username}
                  </Link>
                  <span className="text-[11px] text-[#334155]">→ {msg.to.username}</span>
                  <span className="text-[11px] text-[#334155] ml-auto">{fmt(msg.createdAt)}</span>
                </div>
                <div className="px-3 py-2.5 rounded-xl rounded-tl-sm text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap"
                     style={{ background: '#1E293B', border: '1px solid #334155' }}>
                  {msg.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AdminSendModalProps {
  onClose: () => void;
  onSent: () => void;
}

function AdminSendModal({ onClose, onSent }: AdminSendModalProps) {
  const [toUsername, setTo]     = useState('');
  const [body, setBody]         = useState('');
  const [sending, setSending]   = useState(false);
  const [err, setErr]           = useState('');

  async function send() {
    if (!toUsername.trim() || !body.trim()) { setErr('Usuario y mensaje requeridos'); return; }
    setSending(true); setErr('');
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUsername: toUsername.trim(), body: body.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? 'Error'); setSending(false); return; }
    setSending(false);
    onSent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ background: 'rgba(0,0,0,.7)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card w-full max-w-md" style={{ background: '#0e1627' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#F8FAFC]">Enviar mensaje (como admin)</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-[#94A3B8]"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Para (username)</label>
            <input value={toUsername} onChange={e => setTo(e.target.value)} placeholder="nombre_usuario"
                   className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Mensaje</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} maxLength={1000}
                      placeholder="Escribe el mensaje…"
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] resize-none focus:outline-none focus:border-primary/50" />
            <p className="text-[11px] text-[#334155] mt-1">{body.length}/1000</p>
          </div>
          {err && <p className="text-xs text-[#EF4444]">{err}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-outline flex-1 py-2.5 text-sm justify-center">Cancelar</button>
            <button onClick={send} disabled={sending}
                    className="btn btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              <Send size={14} />{sending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminMessagesClient({ threads: initialThreads, total, page, pages, q }: {
  threads: MsgRow[];
  total: number;
  page: number;
  pages: number;
  q: string;
}) {
  const router = useRouter();
  const [threads, setThreads]   = useState(initialThreads);
  const [viewThread, setView]   = useState<MsgRow | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  async function deleteThread(id: number) {
    if (!confirm('¿Eliminar esta conversación permanentemente?')) return;
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
    setThreads(prev => prev.filter(t => t.id !== id));
    if (viewThread?.id === id) setView(null);
  }

  function handleSent() {
    setShowSend(false);
    router.refresh();
  }

  function pageUrl(p: number) {
    const qs = new URLSearchParams();
    if (p > 1) qs.set('page', String(p));
    if (q) qs.set('q', q);
    return `?${qs.toString()}`;
  }

  return (
    <>
      {viewThread && <ThreadModal thread={viewThread} onClose={() => setView(null)} />}
      {showSend   && <AdminSendModal onClose={() => setShowSend(false)} onSent={handleSent} />}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <form className="flex-1 relative min-w-48">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por usuario o contenido…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
            />
          </form>
          <button
            onClick={() => setShowSend(true)}
            className="btn btn-primary py-2.5 px-4 text-sm flex items-center gap-2"
          >
            <Send size={14} /> Enviar mensaje
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#1f2b41] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0a1224', borderBottom: '1px solid #1f2b41' }}>
                {['De', 'Para', 'Mensaje', 'Respuestas', 'Fecha', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-[#475569]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2b41]">
              {threads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <MessageSquare size={28} className="text-[#334155] mx-auto mb-2" />
                    <p className="text-sm text-[#475569]">
                      {q ? 'Sin resultados para tu búsqueda' : 'No hay mensajes aún'}
                    </p>
                  </td>
                </tr>
              )}
              {threads.map(t => (
                <tr key={t.id} style={{ background: '#0e1627' }}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users?q=${t.from.username}`}
                          className="text-xs font-mono text-primary hover:underline">
                      {t.from.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users?q=${t.to.username}`}
                          className="text-xs font-mono text-[#94A3B8] hover:underline">
                      {t.to.username}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-[#94A3B8] max-w-xs truncate">{t.body}</p>
                    {/* Expandable replies */}
                    {t.replies && t.replies.length > 0 && (
                      <div>
                        <button
                          onClick={() => setExpanded(p => ({ ...p, [t.id]: !p[t.id] }))}
                          className="flex items-center gap-1 text-[11px] text-[#334155] hover:text-[#475569] mt-1 transition-colors"
                        >
                          {expanded[t.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          {t.replies.length} respuesta{t.replies.length !== 1 ? 's' : ''}
                        </button>
                        {expanded[t.id] && (
                          <div className="mt-2 space-y-1.5 pl-3" style={{ borderLeft: '2px solid #1f2b41' }}>
                            {t.replies.map(r => (
                              <div key={r.id} className="text-[11px]">
                                <span className="text-primary">{r.from.username}</span>
                                <span className="text-[#334155] mx-1">→</span>
                                <span className="text-[#475569]">{r.to.username}:</span>
                                <span className="text-[#94A3B8] ml-1">{r.body.slice(0, 80)}{r.body.length > 80 ? '…' : ''}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-center text-[#475569]">
                    {t.replies?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[#475569] whitespace-nowrap">
                    {timeAgo(t.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setView(t)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Ver conversación"
                      >
                        <MessageSquare size={13} />
                      </button>
                      <button
                        onClick={() => deleteThread(t.id)}
                        className="p-1.5 rounded-lg text-[#475569] hover:text-[#EF4444] hover:bg-red-500/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#475569]">Página {page} de {pages} · {total} conversaciones</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={pageUrl(page - 1)} className="btn btn-outline py-1.5 px-4 text-xs">Anterior</Link>}
              {page < pages && <Link href={pageUrl(page + 1)} className="btn btn-outline py-1.5 px-4 text-xs">Siguiente</Link>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
