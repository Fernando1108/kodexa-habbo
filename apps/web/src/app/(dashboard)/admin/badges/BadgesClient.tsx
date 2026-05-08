'use client';

import { useState, useEffect } from 'react';
import { Award, Search, Send } from 'lucide-react';

interface UserOption { id: number; username: string; rank: number }
interface TopBadge { code: string; count: number }

function BadgeImg({ code }: { code: string }) {
  const [err, setErr] = useState(false);
  const src = `https://images.habbo.com/c_images/album1584/${code}.gif`;

  if (!code) return (
    <div className="w-10 h-10 rounded-lg bg-surface border border-[#334155] flex items-center justify-center">
      <Award size={16} className="text-[#334155]" />
    </div>
  );

  if (err) return (
    <div className="w-10 h-10 rounded-lg bg-surface border border-[#334155] flex items-center justify-center"
         title={code}>
      <span className="text-[10px] font-mono text-[#475569]">{code.slice(0, 3)}</span>
    </div>
  );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={code}
      onError={() => setErr(true)}
      className="w-10 h-10 rounded-lg object-contain"
      style={{ background: '#0F172A', border: '1px solid #1f2b41' }}
    />
  );
}

export default function BadgesClient({ users, topBadges }: { users: UserOption[]; topBadges: TopBadge[] }) {
  const [username, setUsername] = useState('');
  const [badgeCode, setBadgeCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce badge code for preview
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(badgeCode.toUpperCase()), 400);
    return () => clearTimeout(t);
  }, [badgeCode]);

  const suggestions = username.length > 0
    ? users.filter(u => u.username.toLowerCase().includes(username.toLowerCase())).slice(0, 6)
    : [];

  async function giveBadge() {
    if (!username || !badgeCode) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/badges/give', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, badgeCode: badgeCode.toUpperCase() }),
      });
      const data = await res.json();
      setResult({
        ok: res.ok,
        msg: res.ok ? `Badge "${badgeCode.toUpperCase()}" dado a ${username} ✓` : (data.error ?? 'Error'),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      {/* Give badge form */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Award size={18} className="text-primary" />
          <h2 className="font-semibold text-[#F8FAFC]">Dar Badge</h2>
        </div>

        <div className="space-y-4">
          {/* Username with autocomplete */}
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Usuario</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                value={username}
                onChange={e => { setUsername(e.target.value); setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Buscar usuario…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[#334155] overflow-hidden z-10"
                     style={{ background: '#0e1627' }}>
                  {suggestions.map(u => (
                    <button
                      key={u.id}
                      onMouseDown={() => { setUsername(u.username); setShowSuggestions(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors flex items-center justify-between"
                    >
                      <span className="text-[#F8FAFC]">{u.username}</span>
                      <span className="text-xs text-[#475569]">R{u.rank}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Badge code + preview */}
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Código del badge</label>
            <div className="flex items-center gap-3">
              <input
                value={badgeCode}
                onChange={e => setBadgeCode(e.target.value.toUpperCase().slice(0, 12))}
                placeholder="Ej: ADM, VIP, MOD"
                maxLength={12}
                className="flex-1 px-3 py-2.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] font-mono focus:outline-none focus:border-primary/50"
              />
              <BadgeImg code={debouncedCode} />
            </div>
            <p className="text-[11px] text-[#334155] mt-1">
              Preview desde images.habbo.com · Máx 12 caracteres
            </p>
          </div>

          {result && (
            <div className="px-3 py-2 rounded-lg text-xs"
                 style={{ background: result.ok ? '#10B98118' : '#EF444418', color: result.ok ? '#10B981' : '#EF4444' }}>
              {result.msg}
            </div>
          )}

          <button
            onClick={giveBadge}
            disabled={sending || !username || !badgeCode}
            className="btn btn-primary py-2.5 px-5 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={14} />{sending ? 'Enviando…' : 'Dar badge'}
          </button>
        </div>
      </div>

      {/* Top badges */}
      <div className="card h-fit">
        <h2 className="font-semibold text-[#F8FAFC] mb-4">Badges más dados</h2>
        {topBadges.length === 0 ? (
          <p className="text-sm text-[#475569]">Sin datos aún</p>
        ) : (
          <div className="space-y-2">
            {topBadges.map((b, i) => (
              <div
                key={b.code}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface transition-colors"
                onClick={() => setBadgeCode(b.code)}
                title="Click para usar"
              >
                <span className="text-xs font-mono text-[#475569] w-4">{i + 1}</span>
                <BadgeImg code={b.code} />
                <span className="font-mono text-xs text-[#F8FAFC] flex-1">{b.code}</span>
                <span className="text-xs text-[#475569]">{b.count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
