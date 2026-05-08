'use client';

import { useState } from 'react';
import { Megaphone, Send, Users, Globe, CheckCircle } from 'lucide-react';

interface AlertRow { id: number; message: string; by: string; sentAt: string }

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

export default function AlertsClient({ recentAlerts }: { recentAlerts: AlertRow[] }) {
  const [alerts, setAlerts] = useState(recentAlerts);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'room'>('all');
  const [roomId, setRoomId] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  async function sendAlert() {
    if (!message.trim()) { setErr('Escribe un mensaje'); return; }
    setSending(true); setErr('');
    const res = await fetch('/api/admin/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, target, roomId: target === 'room' ? roomId : undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? 'Error'); setSending(false); return; }

    // Prepend to local history
    if (data.log) {
      setAlerts(prev => [{ id: data.log.id, message, by: data.log.by, sentAt: data.log.sentAt }, ...prev].slice(0, 10));
    }

    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
    setSending(false);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      {/* Compose */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Megaphone size={18} className="text-primary" />
          <h2 className="font-semibold text-[#F8FAFC]">Nueva alerta</h2>
        </div>

        <div className="space-y-4">
          {/* Target tabs */}
          <div>
            <label className="block text-xs text-[#94A3B8] mb-2">Destinatarios</label>
            <div className="flex gap-2">
              {(['all', 'room'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background:  target === t ? 'rgba(0,212,170,.12)' : '#0F172A',
                    border:      `1px solid ${target === t ? '#00D4AA40' : '#334155'}`,
                    color:       target === t ? '#00D4AA' : '#94A3B8',
                  }}
                >
                  {t === 'all' ? <Globe size={14} /> : <Users size={14} />}
                  {t === 'all' ? 'Todo el hotel' : 'Sala específica'}
                </button>
              ))}
            </div>
          </div>

          {target === 'room' && (
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5">ID de sala</label>
              <input
                type="number"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                placeholder="Ej: 42"
                className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Mensaje</label>
            <textarea
              value={message}
              onChange={e => { setMessage(e.target.value); setErr(''); }}
              rows={5}
              placeholder="Escribe el mensaje de alerta…"
              maxLength={500}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] resize-none focus:outline-none focus:border-primary/50"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-[#334155]">{message.length}/500</p>
              {err && <p className="text-[11px] text-[#EF4444]">{err}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={sendAlert}
              disabled={sending || !message.trim()}
              className="btn btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Send size={14} />{sending ? 'Enviando…' : 'Enviar alerta'}
            </button>
            {sent && (
              <span className="text-sm text-[#10B981] flex items-center gap-1.5">
                <CheckCircle size={14} /> Alerta enviada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card h-fit">
        <h2 className="font-semibold text-[#F8FAFC] mb-4">Alertas recientes</h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-[#475569]">No hay alertas enviadas aún</p>
        ) : (
          <div className="space-y-3">
            {alerts.map(a => (
              <div key={a.id} className="p-3 rounded-xl" style={{ background: '#0a1224', border: '1px solid #1f2b41' }}>
                <p className="text-xs text-[#F8FAFC] leading-relaxed mb-2">{a.message}</p>
                <div className="flex items-center justify-between text-[11px] text-[#475569]">
                  <span>{a.by}</span>
                  <span>{timeAgo(a.sentAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
