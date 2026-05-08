'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, Send, Trash2, ChevronDown, ChevronUp,
  Inbox, ArrowLeft, PenSquare, X,
} from 'lucide-react';

interface MsgUser { id: number; username: string }
interface MsgRow {
  id: number;
  body: string;
  read: boolean;
  createdAt: string;
  from: MsgUser;
  to: MsgUser;
  replies: MsgRow[];
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

interface ThreadViewProps {
  thread: MsgRow;
  meId: number;
  onClose: () => void;
  onDelete: (id: number) => void;
}

function ThreadView({ thread, meId, onClose, onDelete }: ThreadViewProps) {
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [localReplies, setLocalReplies] = useState(thread.replies);
  const router = useRouter();

  async function sendReply() {
    if (!replyBody.trim()) return;
    setSending(true);
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyBody.trim(), parentId: thread.id }),
    });
    if (res.ok) {
      const msg = await res.json();
      setLocalReplies(prev => [...prev, {
        id: msg.id, body: msg.body, read: msg.read, createdAt: msg.createdAt,
        from: msg.from, to: msg.to, replies: [],
      }]);
      setReplyBody('');
    }
    setSending(false);
    router.refresh();
  }

  const allMessages = [thread, ...localReplies];

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onClose} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-surface transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#F8FAFC]">
            Conversación con{' '}
            <span className="text-primary">
              {thread.from.id === meId ? thread.to.username : thread.from.username}
            </span>
          </p>
          <p className="text-xs text-[#475569]">{allMessages.length} mensaje{allMessages.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => onDelete(thread.id)}
          className="p-1.5 rounded-lg text-[#475569] hover:text-[#EF4444] hover:bg-red-500/10 transition-colors"
          title="Eliminar conversación"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4" style={{ minHeight: 0 }}>
        {allMessages.map(msg => {
          const isMe = msg.from.id === meId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[78%] px-4 py-3 rounded-2xl"
                style={{
                  background: isMe ? 'rgba(0,212,170,.15)' : '#1E293B',
                  border:     `1px solid ${isMe ? 'rgba(0,212,170,.25)' : '#334155'}`,
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                }}
              >
                {!isMe && (
                  <p className="text-xs font-semibold text-primary mb-1">{msg.from.username}</p>
                )}
                <p className="text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                <p className="text-[11px] text-[#475569] mt-1.5 text-right">{fmt(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      <div className="rounded-xl border border-[#334155] overflow-hidden" style={{ background: '#0F172A' }}>
        <textarea
          value={replyBody}
          onChange={e => setReplyBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply(); }}
          placeholder="Escribe tu respuesta… (Ctrl+Enter para enviar)"
          rows={3}
          maxLength={1000}
          className="w-full px-4 py-3 text-sm text-[#F8FAFC] bg-transparent resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 py-2" style={{ borderTop: '1px solid #1f2b41' }}>
          <span className="text-[11px] font-mono text-[#334155]">{replyBody.length}/1000</span>
          <button
            onClick={sendReply}
            disabled={sending || !replyBody.trim()}
            className="btn btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send size={12} />{sending ? 'Enviando…' : 'Responder'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewMessageProps {
  onClose: () => void;
  onSent: () => void;
}

function NewMessageModal({ onClose, onSent }: NewMessageProps) {
  const [toUsername, setToUsername] = useState('');
  const [body, setBody]         = useState('');
  const [sending, setSending]   = useState(false);
  const [err, setErr]           = useState('');

  async function send() {
    if (!toUsername.trim() || !body.trim()) { setErr('Usuario y mensaje son obligatorios'); return; }
    setSending(true); setErr('');
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUsername: toUsername.trim(), body: body.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? 'Error al enviar'); setSending(false); return; }
    setSending(false);
    onSent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ background: 'rgba(0,0,0,.6)' }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card w-full max-w-md" style={{ background: '#0e1627' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#F8FAFC]">Nuevo mensaje</h2>
          <button onClick={onClose} className="text-[#475569] hover:text-[#94A3B8] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Para (username)</label>
            <input
              value={toUsername}
              onChange={e => setToUsername(e.target.value)}
              placeholder="nombre_usuario"
              className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Mensaje</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Escribe tu mensaje…"
              className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] resize-none focus:outline-none focus:border-primary/50"
            />
            <p className="text-[11px] text-[#334155] mt-1">{body.length}/1000</p>
          </div>
          {err && <p className="text-xs text-[#EF4444]">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn btn-outline flex-1 py-2.5 text-sm justify-center">
              Cancelar
            </button>
            <button
              onClick={send}
              disabled={sending}
              className="btn btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={14} />{sending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  threads:      MsgRow[];
  meId:         number;
  meUsername:   string;
  box:          string;
  unread:       number;
  openThreadId: number | null;
}

export default function MessagesClient({ threads: initialThreads, meId, meUsername: _mu, box, unread, openThreadId }: Props) {
  const router = useRouter();
  const [threads, setThreads]       = useState(initialThreads);
  const [activeThread, setActive]   = useState<MsgRow | null>(
    openThreadId ? (initialThreads.find(t => t.id === openThreadId) ?? null) : null
  );
  const [showNew, setShowNew]       = useState(false);
  const [expanded, setExpanded]     = useState<Record<number, boolean>>({});

  function switchBox(b: string) {
    router.push(`/messages?box=${b}`);
  }

  function openThread(t: MsgRow) {
    setActive(t);
    // Mark as read
    if (!t.read && t.from.id !== meId) {
      fetch(`/api/messages/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) });
      setThreads(prev => prev.map(m => m.id === t.id ? { ...m, read: true } : m));
    }
  }

  async function deleteThread(id: number) {
    await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThread?.id === id) setActive(null);
  }

  function handleSent() {
    setShowNew(false);
    router.refresh();
  }

  const boxThreads = threads;

  return (
    <>
      {showNew && <NewMessageModal onClose={() => setShowNew(false)} onSent={handleSent} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Mensajes</h1>
          {unread > 0 && (
            <p className="text-sm text-primary mt-0.5">{unread} sin leer</p>
          )}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="btn btn-primary py-2 px-4 text-sm flex items-center gap-2"
        >
          <PenSquare size={14} /> Nuevo mensaje
        </button>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-5" style={{ height: 600 }}>
        {/* Thread list */}
        <div className="card flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: '#1f2b41' }}>
            {['inbox', 'sent'].map(b => (
              <button
                key={b}
                onClick={() => switchBox(b)}
                className="flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                style={{
                  color:            box === b ? '#00D4AA' : '#475569',
                  borderBottom:     `2px solid ${box === b ? '#00D4AA' : 'transparent'}`,
                  background:       'transparent',
                }}
              >
                {b === 'inbox' ? <Inbox size={13} /> : <Send size={13} />}
                {b === 'inbox' ? 'Entrada' : 'Enviados'}
                {b === 'inbox' && unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: '#EF4444', color: '#fff' }}>
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1f2b41]">
            {boxThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <MessageSquare size={32} className="text-[#334155] mb-3" />
                <p className="text-sm text-[#475569]">
                  {box === 'inbox' ? 'Sin mensajes recibidos' : 'Sin mensajes enviados'}
                </p>
              </div>
            ) : boxThreads.map(t => {
              const other  = t.from.id === meId ? t.to : t.from;
              const isOpen = activeThread?.id === t.id;
              const hasReplies = t.replies.length > 0;
              const lastMsg = t.replies.length > 0 ? t.replies[t.replies.length - 1] : t;
              return (
                <div key={t.id}>
                  <button
                    onClick={() => { openThread(t); setExpanded(p => ({ ...p, [t.id]: !p[t.id] })); }}
                    className="w-full text-left px-4 py-3 transition-colors hover:bg-surface"
                    style={{ background: isOpen ? 'rgba(0,212,170,.06)' : 'transparent' }}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Unread dot */}
                      <div className="mt-1.5 w-2 h-2 rounded-full flex-none"
                           style={{ background: !t.read && t.from.id !== meId ? '#00D4AA' : 'transparent' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm truncate ${!t.read && t.from.id !== meId ? 'font-semibold text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                            {other.username}
                          </span>
                          <span className="text-[11px] text-[#334155] flex-none">{timeAgo(lastMsg.createdAt)}</span>
                        </div>
                        <p className="text-xs text-[#475569] truncate mt-0.5">{lastMsg.body}</p>
                        {hasReplies && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-[#334155]">
                            {expanded[t.id] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            {t.replies.length} respuesta{t.replies.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thread view */}
        <div className="card flex flex-col overflow-hidden">
          {activeThread ? (
            <ThreadView
              thread={activeThread}
              meId={meId}
              onClose={() => setActive(null)}
              onDelete={deleteThread}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={40} className="text-[#1E293B] mb-4" />
              <p className="text-[#475569] text-sm">Selecciona una conversación para leerla</p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-4 btn btn-outline py-2 px-4 text-sm flex items-center gap-2"
              >
                <PenSquare size={13} /> Escribir mensaje nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
