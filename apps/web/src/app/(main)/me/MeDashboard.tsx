'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Coins, Gem, Trophy, Home, LogIn, ShoppingBag, UserPlus, Star,
  Pencil, Check, X, Play, Gift, Flame, Copy, ExternalLink,
  Newspaper, Users, ChevronRight, Zap, TrendingUp, Crown,
  Hand,
} from 'lucide-react';
import { RANK_LABELS, RANK_COLORS } from '@kodexa/shared';
import { Avatar, AvatarHead } from '@/components/Avatar';

/* ── Types ─────────────────────────────────────────────────────── */
interface MeUser {
  id: number; username: string; look: string; motto: string;
  rank: number; credits: number; pixels: number;
  createdAt: string; lastLogin: string; online: boolean;
  level: number; experience: number;
}
interface NewsItem {
  id: number; title: string; content: string; imageUrl: string;
  createdAt: string; author: string;
}
interface ActivityItem {
  id: number; action: string; details: string; createdAt: string;
}
interface OnlineUser { username: string; look: string; }
interface PopularRoom { id: number; name: string; ownerName: string; score: number; category: number; }
interface SidebarUser { username: string; look: string; motto: string; }
interface LatestUser  { username: string; look: string; createdAt: string; }

interface Props {
  user:               MeUser;
  news:               NewsItem[];
  activity:           ActivityItem[];
  roomCount:          number;
  dailyRewardClaimed: boolean;
  onlineUsers:        OnlineUser[];
  onlineCount:        number;
  popularRooms:       PopularRoom[];
  featuredUser:       SidebarUser | null;
  latestUser:         LatestUser  | null;
}

/* ── Helpers ────────────────────────────────────────────────────── */
function timeago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ahora mismo';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function activityIcon(action: string) {
  if (action.includes('login'))                                 return <LogIn size={13} />;
  if (action.includes('register'))                             return <UserPlus size={13} />;
  if (action.includes('room'))                                 return <Home size={13} />;
  if (action.includes('marketplace') || action.includes('buy')) return <ShoppingBag size={13} />;
  if (action.includes('daily_reward'))                         return <Gift size={13} />;
  return <Zap size={13} />;
}

function activityColor(action: string): string {
  if (action.includes('daily_reward')) return '#F59E0B';
  if (action.includes('login'))        return '#00D4AA';
  if (action.includes('register'))     return '#7C3AED';
  if (action.includes('room'))         return '#10B981';
  if (action.includes('buy'))          return '#F59E0B';
  return '#94A3B8';
}

const XP_PER_LEVEL = 1000;

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function MeDashboard({
  user, news, activity, roomCount,
  dailyRewardClaimed, onlineUsers, onlineCount,
  popularRooms, featuredUser, latestUser,
}: Props) {
  /* Motto */
  const [motto,        setMotto]    = useState(user.motto);
  const [editingMotto, setEditing]  = useState(false);
  const [draftMotto,   setDraft]    = useState(user.motto);
  const [savingMotto,  setSaving]   = useState(false);
  const [mottoSaved,   setMottoSaved] = useState(false);

  /* Daily reward */
  const [claimed,      setClaimed]  = useState(dailyRewardClaimed);
  const [rewardMsg,    setRewardMsg] = useState('');
  const [claiming,     setClaiming] = useState(false);

  /* Referral copy */
  const [copied, setCopied] = useState(false);

  const rankLabel  = RANK_LABELS[user.rank]  ?? 'Normal';
  const rankColor  = RANK_COLORS[user.rank]  ?? '#94A3B8';
  const xpToNext   = user.level * XP_PER_LEVEL;
  const xpPct      = Math.min(100, Math.round((user.experience % XP_PER_LEVEL) / XP_PER_LEVEL * 100));

  /* Motto save */
  async function saveMotto() {
    if (draftMotto === motto) { setEditing(false); return; }
    setSaving(true);
    const r = await fetch('/api/me/motto', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motto: draftMotto }),
    });
    if (r.ok) {
      setMotto(draftMotto);
      setMottoSaved(true);
      setTimeout(() => setMottoSaved(false), 2000);
    }
    setSaving(false);
    setEditing(false);
  }

  /* Daily reward claim */
  async function claimReward() {
    setClaiming(true);
    const r = await fetch('/api/me/daily-reward', { method: 'POST' });
    const d = await r.json();
    if (r.ok) {
      setClaimed(true);
      setRewardMsg(`+${d.credits} créditos, +${d.pixels} píxeles`);
    } else {
      setRewardMsg(d.error ?? 'Error');
    }
    setClaiming(false);
    setTimeout(() => setRewardMsg(''), 4000);
  }

  /* Copy referral */
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${user.username}`
    : `/register?ref=${user.username}`;

  const copyReferral = useCallback(() => {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralUrl]);

  /* Featured news */
  const [featured, ...restNews] = news;

  return (
    <div className="min-h-screen bg-[#0F172A] me-page-bg pb-12">
      <div className="max-w-7xl mx-auto px-4 py-6 me3-grid">

        {/* ══════════════════════════════════════════════════════
            SIDEBAR IZQUIERDO — Avatar Card
        ══════════════════════════════════════════════════════ */}
        <aside className="me3-left fade-in-up delay-0">
          <div className="me-avatar-card">

            {/* Profile banner */}
            <div className="me-profile-banner" />

            {/* Avatar — overlaps banner */}
            <div className="flex flex-col items-center pb-3" style={{ marginTop: -44 }}>
              <div className="me-avatar-container relative" style={{ '--rank-color': rankColor } as React.CSSProperties}>
                <Avatar
                  look={user.look} size="l" direction={2} gesture="std"
                  style={{ height: 148, display: 'block', filter: `drop-shadow(0 0 20px ${rankColor}55)` }}
                />
                {/* Online indicator */}
                <span
                  className={`me-online-indicator${user.online ? ' online' : ''}`}
                  title={user.online ? 'En línea' : 'Desconectado'}
                />
              </div>

              {/* Username */}
              <h1 className="mt-3 text-lg font-bold text-[#F8FAFC] tracking-tight">{user.username}</h1>

              {/* Rank pill */}
              <span className="mt-1 px-3 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: `${rankColor}1A`, color: rankColor, border: `1px solid ${rankColor}44` }}>
                {rankLabel}
              </span>

              {/* Motto editable */}
              <div className="mt-2 w-full px-1">
                {editingMotto ? (
                  <div className="flex gap-1">
                    <input
                      className="flex-1 inp text-xs py-1 px-2 text-center"
                      value={draftMotto}
                      onChange={e => setDraft(e.target.value)}
                      maxLength={127} autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter')  saveMotto();
                        if (e.key === 'Escape') setEditing(false);
                      }}
                    />
                    <button onClick={saveMotto} disabled={savingMotto}
                      className="icon-btn text-[#00D4AA]"><Check size={13} /></button>
                    <button onClick={() => { setEditing(false); setDraft(motto); }}
                      className="icon-btn text-[#94A3B8]"><X size={13} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditing(true); setDraft(motto); }}
                    className="w-full text-center text-xs text-[#64748B] italic hover:text-[#94A3B8] transition-colors group flex items-center justify-center gap-1"
                  >
                    <span className="truncate">&ldquo;{motto}&rdquo;</span>
                    <Pencil size={10} className="opacity-0 group-hover:opacity-70 transition-opacity flex-none" />
                  </button>
                )}
                {mottoSaved && (
                  <p className="text-[10px] text-[#10B981] text-center mt-1 flex items-center justify-center gap-1 font-mono">
                    <Check size={10} /> Guardado
                  </p>
                )}
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex gap-1.5 justify-center flex-wrap px-3 py-2 border-t border-[#1f2b41]">
              <StatPill icon={<Coins size={12} />} value={user.credits.toLocaleString()} color="#F59E0B" tooltip="Créditos: moneda principal del hotel" />
              <StatPill icon={<Gem size={12} />}   value={user.pixels.toLocaleString()}  color="#7C3AED" tooltip="Píxeles: moneda secundaria para decoración" />
              <StatPill icon={<Trophy size={12} />} value={`Nv ${user.level}`}           color="#00D4AA" tooltip="Tu nivel de experiencia en el hotel" />
            </div>

            {/* XP bar */}
            <div className="px-4 py-3 border-t border-[#1f2b41]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-mono text-[#475569]">Experiencia</span>
                <span className="text-[10px] font-mono text-[#475569]">{user.experience % XP_PER_LEVEL}/{xpToNext} XP</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <p className="text-[10px] text-[#475569] mt-1 text-center font-mono">{xpPct}% hacia nivel {user.level + 1}</p>
            </div>

            {/* Action buttons */}
            <div className="px-3 pb-3 flex flex-col gap-2 border-t border-[#1f2b41] pt-3">
              <Link href="/hotel"
                className="btn btn-primary flex items-center justify-center gap-2 py-2.5 text-sm me-enter-btn">
                <Play size={14} className="fill-current" />Entrar al Hotel
              </Link>
              <div className="grid grid-cols-2 gap-1.5">
                <Link href="/settings"
                  className="btn btn-outline flex items-center justify-center gap-1.5 py-2 text-xs">
                  <Pencil size={12} />Cuenta
                </Link>
                <Link href={`/community/profiles/${user.username}`}
                  className="btn btn-outline flex items-center justify-center gap-1.5 py-2 text-xs">
                  <Star size={12} />Perfil
                </Link>
              </div>
            </div>

            {/* Member since */}
            <div className="px-3 pb-3 text-center">
              <p className="text-[10px] text-[#334155] font-mono">
                Miembro desde {new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════
            CONTENIDO PRINCIPAL
        ══════════════════════════════════════════════════════ */}
        <main className="me3-main min-w-0 flex flex-col gap-5">

          {/* Banner Hero */}
          <div className="me-banner me-banner-dotted me-banner-premium rounded-2xl overflow-hidden p-6 relative fade-in-up delay-100">
            <div className="aurora" style={{ position: 'absolute', width: 300, height: 300, top: -100, right: -60, opacity: .35 }} />
            <div className="relative z-10">
              <p className="text-xs font-mono text-[#00D4AA] uppercase tracking-widest mb-1">Panel de usuario</p>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mb-1 flex items-center gap-2">
                <Hand size={22} className="me-wave-icon text-[#F59E0B] flex-none" />
                ¡Bienvenido, <span className="text-gradient">{user.username}</span>!
              </h2>
              <p className="text-sm text-[#94A3B8] mb-4">
                {onlineCount > 0
                  ? <>Hay <span className="text-[#00D4AA] font-semibold">{onlineCount}</span> {onlineCount === 1 ? 'persona' : 'personas'} en el hotel ahora mismo.</>
                  : 'El hotel te está esperando.'}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="me-banner-stat" title="Créditos: moneda principal del hotel">
                  <Coins size={13} className="text-[#F59E0B]" />
                  <span className="font-mono font-bold text-[#F59E0B]">{user.credits.toLocaleString()}</span>
                  <span className="text-[#94A3B8]">créditos</span>
                </div>
                <div className="me-banner-stat" title="Salas creadas por ti en el hotel">
                  <Home size={13} className="text-[#00D4AA]" />
                  <span className="font-mono font-bold text-[#00D4AA]">{roomCount}</span>
                  <span className="text-[#94A3B8]">salas</span>
                </div>
                <div className="me-banner-stat" title="Tu nivel de experiencia en el hotel">
                  <Trophy size={13} className="text-[#7C3AED]" />
                  <span className="font-mono font-bold text-[#7C3AED]">Nv {user.level}</span>
                  <span className="text-[#94A3B8]">nivel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Noticias recientes */}
          <section className="fade-in-up delay-200">
            <SectionHeader title="Últimas noticias" link={{ href: '/community/news', label: 'Ver todas' }} />

            {news.length > 0 ? (
              <div className="flex flex-col gap-3">
                {/* Featured */}
                {featured && (
                  <Link href={`/community/news/${featured.id}`} className="me-news-featured group">
                    <div className="me-news-featured-thumb">
                      {featured.imageUrl ? (
                        <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                          <Newspaper size={32} className="text-[#334155]" />
                        </div>
                      )}
                      <div className="me-news-featured-overlay" />
                      <div className="me-news-featured-badge">DESTACADO</div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#F8FAFC] text-base group-hover:text-[#00D4AA] transition-colors line-clamp-2 mb-1">{featured.title}</h3>
                      <p className="text-xs text-[#94A3B8] line-clamp-2 mb-2">{featured.content.slice(0, 140)}</p>
                      <p className="text-[11px] text-[#475569] font-mono">{featured.author} · {timeago(featured.createdAt)}</p>
                    </div>
                  </Link>
                )}

                {/* Rest */}
                {restNews.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {restNews.map(n => (
                      <Link key={n.id} href={`/community/news/${n.id}`} className="me-news-mini group">
                        <div className="me-news-mini-thumb">
                          {n.imageUrl ? (
                            <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover" />
                          ) : (
                            <Newspaper size={16} className="text-[#475569]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#CBD5E1] group-hover:text-[#00D4AA] transition-colors line-clamp-1">{n.title}</p>
                          <p className="text-[11px] text-[#475569] font-mono mt-0.5">{n.author} · {timeago(n.createdAt)}</p>
                        </div>
                        <ChevronRight size={14} className="text-[#334155] flex-none group-hover:text-[#00D4AA] transition-colors" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyState icon={<Newspaper size={28} />} text="No hay noticias publicadas aún." />
            )}
          </section>

          {/* Mis salas */}
          <section className="fade-in-up delay-300">
            <SectionHeader
              title="Mis salas"
              badge={roomCount}
              link={{ href: '/hotel', label: 'Gestionar' }}
            />
            {roomCount > 0 ? (
              <div className="card p-4 flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-xl bg-[#00D4AA15] flex items-center justify-center flex-none">
                  <Home size={16} className="text-[#00D4AA]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[#F8FAFC] font-medium">Tienes {roomCount} {roomCount === 1 ? 'sala' : 'salas'}</p>
                  <p className="text-xs text-[#64748B]">Entra al hotel para verlas y editarlas.</p>
                </div>
                <Link href="/hotel" className="ml-auto btn btn-outline py-1.5 px-3 text-xs flex-none">
                  Ir al hotel →
                </Link>
              </div>
            ) : (
              <div className="card p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#1f2b41] flex items-center justify-center mx-auto mb-3">
                  <Home size={18} className="text-[#334155]" />
                </div>
                <p className="text-sm text-[#64748B] mb-2">No tienes salas aún.</p>
                <Link href="/hotel" className="text-xs text-[#00D4AA] hover:underline">
                  Crea tu primera sala en el hotel →
                </Link>
              </div>
            )}
          </section>

          {/* Salas populares del hotel */}
          <section className="fade-in-up delay-300">
            <SectionHeader
              title="Salas populares ahora"
              icon={<TrendingUp size={14} className="text-[#F59E0B]" />}
              link={{ href: '/community/rooms', label: 'Ver todas' }}
            />
            {popularRooms.length > 0 ? (
              <div className="flex flex-col gap-2">
                {popularRooms.map((room, i) => (
                  <div key={room.id} className="me-popular-room">
                    <span className="me-popular-room-rank">{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
                      style={{ background: '#00D4AA12' }}>
                      <Home size={14} className="text-[#00D4AA]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#CBD5E1] truncate">{room.name}</p>
                      <p className="text-[11px] text-[#475569] font-mono">de {room.ownerName}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#475569] font-mono flex-none">
                      <Star size={10} className="text-[#F59E0B]" />
                      {room.score}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center">
                <p className="text-sm text-[#64748B]">Sé el primero en crear una sala.</p>
              </div>
            )}
          </section>

          {/* Actividad reciente */}
          <section className="fade-in-up delay-400">
            <SectionHeader title="Actividad reciente" />
            {activity.length > 0 ? (
              <div className="me-timeline">
                {activity.map((a, i) => {
                  const color = activityColor(a.action);
                  return (
                    <div key={a.id} className="me-timeline-row">
                      <div className="me-timeline-track">
                        <div className="me-timeline-dot" style={{ background: color, boxShadow: `0 0 6px ${color}88` }} />
                        {i < activity.length - 1 && <div className="me-timeline-line" />}
                      </div>
                      <div className="me-timeline-content">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-none mt-0.5"
                            style={{ background: `${color}18`, color }}>
                            {activityIcon(a.action)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-[#CBD5E1] capitalize">{a.action.replace(/_/g, ' ')}</p>
                            {a.details && <p className="text-xs text-[#64748B] truncate">{a.details}</p>}
                          </div>
                          <span className="text-[11px] text-[#475569] font-mono flex-none">{timeago(a.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<Zap size={28} />} text="No hay actividad registrada aún." />
            )}
          </section>

        </main>

        {/* ══════════════════════════════════════════════════════
            SIDEBAR DERECHO
        ══════════════════════════════════════════════════════ */}
        <aside className="me3-right flex flex-col gap-4">

          {/* Discord Widget */}
          <div className="me-discord-widget fade-in-up delay-150">
            <div className="me-discord-header">
              {/* Discord logo */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M19.27 5.33A18.06 18.06 0 0 0 14.97 4l-.2.39c1.5.34 2.85.93 4.18 1.86A14.4 14.4 0 0 0 9 6.25c-1.78.13-3.6.5-5.27 1.08l-.2-.39c1.32-.4 2.78-.7 4.3-.93C5.95 5.32 4.4 5.66 3 6.13 1.13 9.36.32 12.86.07 16.36c1.7 1.25 3.36 2.05 5 2.55l.65-.92c-.93-.34-1.78-.78-2.6-1.36.22-.16.44-.3.65-.46 3.39 1.6 7.05 1.6 10.4 0 .21.16.43.3.65.46-.82.58-1.7 1.02-2.61 1.36l.65.92c1.64-.5 3.3-1.3 5-2.55-.4-4.05-1.27-7.55-3.59-11.06zM8.52 14.5c-.98 0-1.79-.92-1.79-2.05s.79-2.05 1.79-2.05 1.81.92 1.79 2.05c.02 1.13-.79 2.05-1.79 2.05zm6.96 0c-.98 0-1.79-.92-1.79-2.05s.79-2.05 1.79-2.05 1.81.92 1.79 2.05c0 1.13-.79 2.05-1.79 2.05z"/>
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight">Kodexa Hotel</p>
                <p className="text-[11px] text-white/70">Comunidad oficial</p>
              </div>
              <span className="me-discord-online-badge">
                <span className="me-discord-online-dot" />
                online
              </span>
            </div>
            <div className="me-discord-body">
              <p className="text-[11px] text-[#94A3B8] mb-3">
                Únete a nuestra comunidad en Discord. Anuncios, sorteos y soporte.
              </p>
              <a
                href="#"
                className="block w-full text-center py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#5865F2' }}
              >
                Unirse al servidor
              </a>
            </div>
          </div>

          {/* Recompensa Diaria */}
          <div className={`me-reward-card fade-in-up delay-200${!claimed ? ' unclaimed' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`me-reward-icon ${!claimed ? 'me-reward-shake' : ''}`}>
                <Gift size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#F8FAFC]">Recompensa Diaria</p>
                <div className="flex items-center gap-1 text-[11px] text-[#F59E0B] font-mono">
                  <Flame size={11} />Racha activa
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-[#F59E0B0D] border border-[#F59E0B22]">
              <Coins size={13} className="text-[#F59E0B]" />
              <span className="text-xs text-[#94A3B8]">+100 créditos <span className="text-[#475569]">+</span> +50 píxeles</span>
            </div>

            {rewardMsg && (
              <p className={`text-xs mb-2 text-center font-mono ${rewardMsg.includes('+') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {rewardMsg}
              </p>
            )}

            <button
              onClick={claimReward}
              disabled={claimed || claiming}
              className={`w-full btn justify-center text-sm py-2.5 ${
                claimed ? 'btn-outline opacity-60 cursor-default' : 'me-reward-btn'
              }`}
            >
              {claiming ? '...' : claimed ? <><Check size={13} /> Ya reclamaste hoy</> : '¡Reclamar recompensa!'}
            </button>
            {!claimed && (
              <p className="text-[10px] text-[#475569] text-center mt-2">Vuelve mañana para mantener tu racha</p>
            )}
          </div>

          {/* Usuario de la semana */}
          <div className="card p-4 fade-in-up delay-250" style={{ borderColor: '#F59E0B44' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#F59E0B18' }}>
                <Crown size={14} className="text-[#F59E0B]" />
              </div>
              <p className="text-sm font-semibold text-[#F8FAFC]">Kodexa de la semana</p>
            </div>
            {featuredUser ? (
              <Link href={`/community/profiles/${featuredUser.username}`}
                className="flex items-center gap-2.5 group">
                <div className="w-10 h-12 flex-none overflow-hidden">
                  <AvatarHead look={featuredUser.look} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F8FAFC] group-hover:text-[#F59E0B] transition-colors truncate">
                    {featuredUser.username}
                  </p>
                  <p className="text-[11px] text-[#64748B] italic truncate">&ldquo;{featuredUser.motto}&rdquo;</p>
                </div>
              </Link>
            ) : (
              <p className="text-xs text-[#64748B] text-center py-1">¡Tú podrías ser el próximo!</p>
            )}
          </div>

          {/* Nuevo jugador */}
          <div className="card p-4 fade-in-up delay-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#00D4AA12' }}>
                <UserPlus size={14} className="text-[#00D4AA]" />
              </div>
              <p className="text-sm font-semibold text-[#F8FAFC]">Nuevo jugador</p>
            </div>
            {latestUser ? (
              <Link href={`/community/profiles/${latestUser.username}`}
                className="flex items-center gap-2.5 group">
                <div className="w-10 h-12 flex-none overflow-hidden">
                  <AvatarHead look={latestUser.look} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F8FAFC] group-hover:text-[#00D4AA] transition-colors truncate">
                    {latestUser.username}
                  </p>
                  <p className="text-[11px] text-[#475569] font-mono">Se unió {timeago(latestUser.createdAt)}</p>
                </div>
              </Link>
            ) : (
              <p className="text-xs text-[#64748B] text-center py-1">No hay datos aún.</p>
            )}
          </div>

          {/* Centro de Referidos */}
          <div className="card p-4 fade-in-up delay-350">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#7C3AED1A] flex items-center justify-center">
                <Users size={14} className="text-[#7C3AED]" />
              </div>
              <p className="text-sm font-semibold text-[#F8FAFC]">Centro de Referidos</p>
            </div>
            <p className="text-[11px] text-[#64748B] mb-3">
              Invita amigos y gana <span className="text-[#F59E0B] font-semibold">500 créditos</span> por cada uno.
            </p>
            <div className="me-referral-row">
              <input
                readOnly
                value={referralUrl}
                className="inp text-[11px] py-1.5 px-2 truncate flex-1 min-w-0"
              />
              <button onClick={copyReferral}
                className={`icon-btn flex-none transition-colors ${copied ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}
                title="Copiar link">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-[11px] text-[#475569] flex-1">Invitados: <span className="text-[#F8FAFC] font-mono">0</span></span>
              <a href={`https://twitter.com/intent/tweet?text=¡Únete+a+Kodexa+Hotel!+${encodeURIComponent(referralUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="me-share-btn" style={{ background: '#00000066', color: '#94A3B8' }}
                title="Compartir en X">
                <ExternalLink size={11} />
              </a>
              <a href={`https://wa.me/?text=¡Únete+a+Kodexa+Hotel!+${encodeURIComponent(referralUrl)}`}
                target="_blank" rel="noopener noreferrer"
                className="me-share-btn" style={{ background: '#25D36618', color: '#25D366' }}
                title="Compartir por WhatsApp">
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Usuarios Online */}
          <div className="card p-4 fade-in-up delay-400">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#F8FAFC]">Usuarios online</p>
              <span className="badge badge-ok font-mono">{onlineCount}</span>
            </div>
            {onlineUsers.length > 0 ? (
              <div className="me-online-grid">
                {onlineUsers.map(u => (
                  <Link key={u.username} href={`/community/profiles/${u.username}`}
                    title={u.username} className="me-online-avatar">
                    <AvatarHead look={u.look} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span className="me-online-dot" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#475569] text-center py-2">No hay usuarios online ahora.</p>
            )}
          </div>

          {/* Redes Sociales */}
          <div className="card p-4 fade-in-up delay-400">
            <p className="text-sm font-semibold text-[#F8FAFC] mb-3">Nuestras redes</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Discord',    color: '#5865F2', bg: '#5865F21A', href: '#' },
                { name: 'Instagram',  color: '#E4405F', bg: '#E4405F1A', href: '#' },
                { name: 'X / Twitter', color: '#94A3B8', bg: '#94A3B81A', href: '#' },
                { name: 'TikTok',     color: '#F8FAFC', bg: '#F8FAFC0D', href: '#' },
              ].map(({ name, color, bg, href }) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer"
                  className="me-social-btn"
                  style={{ '--social-color': color, '--social-bg': bg } as React.CSSProperties}>
                  <span className="text-[11px] font-medium" style={{ color }}>{name}</span>
                </a>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */
function StatPill({ icon, value, color, tooltip }: { icon: React.ReactNode; value: string; color: string; tooltip?: string }) {
  return (
    <span
      className="me-stat-pill hover:scale-105 transition-transform cursor-default"
      style={{ color }}
      title={tooltip}
    >
      {icon}
      <span className="font-mono">{value}</span>
    </span>
  );
}

function SectionHeader({
  title, badge, link, icon,
}: {
  title: string;
  badge?: number;
  link?: { href: string; label: string };
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="me-section-title">
        {icon}
        {title}
        {badge !== undefined && (
          <span className="font-mono text-xs text-[#475569]">({badge})</span>
        )}
      </h2>
      {link && (
        <Link href={link.href}
          className="text-[11px] text-[#00D4AA] hover:underline flex items-center gap-0.5 transition-colors">
          {link.label} <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="card p-6 flex flex-col items-center gap-2 text-center" style={{ border: '1px dashed rgba(51,65,85,.5)' }}>
      <div className="w-11 h-11 rounded-xl bg-[#1f2b41] flex items-center justify-center text-[#334155] opacity-60">
        {icon}
      </div>
      <p className="text-sm text-[#64748B]">{text}</p>
    </div>
  );
}
