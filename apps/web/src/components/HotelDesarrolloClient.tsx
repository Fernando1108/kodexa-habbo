'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  LogOut, Server, FlaskConical, Cpu, ExternalLink,
  Clock, AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, Globe, Lock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface GatewayUser {
  username: string;
  email:    string;
  rank:     number;
}

type EnvStatus = 'active' | 'reserved' | 'experimental';

interface EnvCardProps {
  icon:        ReactNode;
  name:        string;
  engine:      string;
  status:      EnvStatus;
  description: string;
  note:        string;
  action:      ReactNode;
  accentColor: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const AMBER        = '#F59E0B';
const AMBER_DIM    = 'rgba(245,158,11,.10)';
const AMBER_BORDER = 'rgba(245,158,11,.22)';

const RANK_LABELS: Record<number, string> = {
  1: 'Normal',       2: 'VIP',           3: 'Ayudante',
  4: 'Moderador',    5: 'Game Master',   6: 'Manager',
  7: 'Admin',        8: 'Hotel Manager', 9: 'Desarrollador',
  10: 'Fundador',
};

const STATUS_STYLES: Record<EnvStatus, { bg: string; color: string; label: string }> = {
  active:       { bg: 'rgba(16,185,129,.12)',  color: '#10B981', label: 'Disponible'   },
  reserved:     { bg: 'rgba(100,116,139,.12)', color: '#64748B', label: 'Reservado'    },
  experimental: { bg: 'rgba(124,58,237,.12)',  color: '#a78bfa', label: 'Experimental' },
};

// ── Internal component ─────────────────────────────────────────────────────

function EnvCard({ icon, name, engine, status, description, note, action, accentColor }: EnvCardProps) {
  const s = STATUS_STYLES[status];
  return (
    <div
      style={{
        background:   'rgba(19,30,54,.6)',
        border:       '1px solid #1f2b41',
        borderLeft:   `3px solid ${accentColor}`,
        borderRadius: 12,
        padding:      '1.125rem',
        display:      'flex',
        flexDirection:'column',
        gap:          10,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {icon}
          <div>
            <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>{name}</div>
            <div className="text-xs font-mono"     style={{ color: '#475569' }}>{engine}</div>
          </div>
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full flex-none"
          style={{ background: s.bg, color: s.color }}
        >
          {s.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>{description}</p>

      {/* Note */}
      <p className="text-xs" style={{ color: '#334155' }}>&#9888; {note}</p>

      {/* Action */}
      <div style={{ marginTop: 'auto' }}>{action}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function HotelDesarrolloClient({ user }: { user: GatewayUser }) {
  const [diagOpen, setDiagOpen] = useState(false);

  const rankLabel   = RANK_LABELS[user.rank] ?? 'Desconocido';
  const isFounder   = user.rank >= 10;
  const isDeveloper = user.rank >= 9;

  const nitroUrl    = process.env['NEXT_PUBLIC_NITRO_URL']         ?? 'http://localhost:8081';
  const betaEnabled = process.env['NEXT_PUBLIC_ENABLE_BETA_HOTEL'] !== 'false';
  const devEnabled  = process.env['NEXT_PUBLIC_ENABLE_DEV_HOTEL']  !== 'false';

  // ── Disabled button style (reused for "coming soon") ──────────────────────
  const disabledBtn: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    width:          '100%',
    padding:        '0.5rem 1rem',
    borderRadius:   10,
    background:     'rgba(100,116,139,.08)',
    border:         '1px solid rgba(100,116,139,.18)',
    color:          '#475569',
    fontSize:       '0.8rem',
    cursor:         'not-allowed',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0B1322' }}>

      {/* ── Topbar ── */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-5"
        style={{
          height:         52,
          background:     'rgba(11,19,34,.97)',
          borderBottom:   `1px solid ${AMBER_BORDER}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: `linear-gradient(135deg,${AMBER},#D97706)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.75rem', fontWeight: 800, color: '#0B1322',
          }}
        >D</div>
        <span className="font-bold text-sm" style={{ color: '#F8FAFC' }}>
          Kodexa<span style={{ color: AMBER }}>.</span>Desarrollo
        </span>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}`, fontSize: '0.62rem' }}
        >
          DEVELOPER / FOUNDER
        </span>

        {/* Right: user info + signout */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs hidden sm:block" style={{ color: '#64748B' }}>
            {user.username}
            <span
              className="ml-2 px-1.5 py-0.5 rounded"
              style={{ background: AMBER_DIM, color: AMBER, fontSize: '0.6rem', fontWeight: 700 }}
            >
              {rankLabel.toUpperCase()}
            </span>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="icon-btn"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-5 py-8 flex flex-col gap-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: '#F8FAFC' }}>
            Entorno de Desarrollo
          </h1>
          <p className="text-sm" style={{ color: '#64748B' }}>
            Zona privada para pruebas, diagnóstico y entornos experimentales.
            Acceso exclusivo DEVELOPER (rank&nbsp;9) / FOUNDER (rank&nbsp;10).
          </p>
        </div>

        {/* Security notice */}
        <div
          style={{
            background:   AMBER_DIM,
            border:       `1px solid ${AMBER_BORDER}`,
            borderRadius: 12,
            padding:      '0.75rem 1rem',
            display:      'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-none mt-0.5" style={{ color: AMBER }} />
          <span className="text-sm" style={{ color: '#94A3B8', lineHeight: 1.55 }}>
            <strong style={{ color: AMBER }}>Zona de desarrollo</strong> — Los cambios en entornos dev
            no deben afectar el hotel principal. No mezcles datos entre arcturus_main y arcturus_dev.
            Verifica siempre en dev antes de aplicar a producción.
          </span>
        </div>

        {/* User info strip */}
        <div
          style={{
            background:   'rgba(19,30,54,.6)',
            border:       '1px solid #1f2b41',
            borderRadius: 12,
            padding:      '0.75rem 1rem',
            display:      'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center',
          }}
        >
          {[
            { label: 'Usuario',  value: user.username },
            { label: 'Email',    value: user.email },
            { label: 'Rank',     value: `${user.rank} — ${rankLabel}`, color: AMBER },
            { label: 'Acceso',   value: isFounder ? 'FOUNDER (completo)' : isDeveloper ? 'DEVELOPER' : 'Sin acceso', color: '#10B981' },
          ].map(item => (
            <div key={item.label}>
              <div className="text-xs mb-0.5"  style={{ color: '#475569' }}>{item.label}</div>
              <div className="text-sm font-medium" style={{ color: item.color ?? '#F8FAFC' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Environment cards */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))' }}
        >

          {/* A — Hotel Principal */}
          <EnvCard
            icon={<Server className="w-5 h-5" style={{ color: '#00D4AA' }} />}
            name="Hotel Principal"
            engine="arcturus_main · Nitro"
            status="active"
            description="Entorno estable de producción con usuarios reales. kodexa_hotel es la fuente de verdad para rangos y sesión. Auth Bridge via /api/sso."
            note="Entorno estable para usuarios reales. Cambios aquí afectan a todos."
            accentColor="#00D4AA"
            action={
              <Link
                href="/hotel"
                className="btn flex items-center gap-2"
                style={{
                  fontSize: '0.8rem', borderRadius: 10,
                  width: '100%', justifyContent: 'center',
                  padding: '0.5rem 1rem',
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Entrar al hotel
              </Link>
            }
          />

          {/* B — Arcturus Dev */}
          <EnvCard
            icon={<Cpu className="w-5 h-5" style={{ color: AMBER }} />}
            name="Arcturus Dev"
            engine="arcturus_dev · Nitro Dev"
            status={devEnabled ? 'active' : 'reserved'}
            description="Laboratorio para pruebas de catálogo, furnis, comandos Arcturus y actualizaciones antes de producción. Bridge separado del hotel principal."
            note={
              devEnabled
                ? 'Entorno activo. Datos separados de producción. Solo Developer/Founder (rank ≥ 9).'
                : 'NEXT_PUBLIC_ENABLE_DEV_HOTEL=false — deshabilitado por feature flag.'
            }
            accentColor={AMBER}
            action={
              devEnabled ? (
                <Link
                  href="/hotel-dev"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            8,
                    width:          '100%',
                    padding:        '0.5rem 1rem',
                    borderRadius:   10,
                    background:     AMBER_DIM,
                    border:         `1px solid ${AMBER_BORDER}`,
                    color:          AMBER,
                    fontSize:       '0.8rem',
                    textDecoration: 'none',
                    fontWeight:     600,
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Entrar a Arcturus Dev
                </Link>
              ) : (
                <button disabled style={disabledBtn}>
                  <Clock className="w-3.5 h-3.5" />
                  Deshabilitado por feature flag
                </button>
              )
            }
          />

          {/* C — Custom Emulator Beta */}
          <EnvCard
            icon={<FlaskConical className="w-5 h-5" style={{ color: '#a78bfa' }} />}
            name="Custom Emulator Beta"
            engine="kodexa-custom · WS :2098"
            status="experimental"
            description="Entorno experimental del emulador propio (Node.js / TypeScript / WebSocket). Para features exclusivas: economy, wired, marketplace."
            note={isFounder && betaEnabled ? 'Acceso FOUNDER habilitado vía /hotel-beta.' : 'Requiere rank FOUNDER (10) para acceder.'}
            accentColor="#7C3AED"
            action={
              isFounder && betaEnabled ? (
                <Link
                  href="/hotel-beta"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            8,
                    width:          '100%',
                    padding:        '0.5rem 1rem',
                    borderRadius:   10,
                    background:     'rgba(124,58,237,.12)',
                    border:         '1px solid rgba(124,58,237,.3)',
                    color:          '#a78bfa',
                    fontSize:       '0.8rem',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Entrar a beta
                </Link>
              ) : (
                <button disabled style={disabledBtn}>
                  <Lock className="w-3.5 h-3.5" />
                  {isFounder ? 'Beta deshabilitada (env)' : 'Solo FOUNDER (rank 10)'}
                </button>
              )
            }
          />

        </div>

        {/* D — Diagnostic section (collapsible) */}
        <div
          style={{
            background:   'rgba(19,30,54,.6)',
            border:       '1px solid #1f2b41',
            borderRadius: 12,
            overflow:     'hidden',
          }}
        >
          <button
            onClick={() => setDiagOpen(v => !v)}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              width:          '100%',
              padding:        '0.875rem 1rem',
              background:     'transparent',
              border:         'none',
              cursor:         'pointer',
            }}
          >
            <span
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#F8FAFC' }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: '#00D4AA' }} />
              Diagnóstico de entorno
            </span>
            {diagOpen
              ? <ChevronUp   className="w-4 h-4" style={{ color: '#475569' }} />
              : <ChevronDown className="w-4 h-4" style={{ color: '#475569' }} />
            }
          </button>

          {diagOpen && (
            <div style={{ borderTop: '1px solid #1f2b41', padding: '1rem' }}>
              <div
                className="grid gap-2.5"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}
              >
                {[
                  { label: 'Usuario',            value: user.username },
                  { label: 'Email',              value: user.email },
                  { label: 'Rank',               value: `${user.rank} (${rankLabel})` },
                  { label: 'Acceso /desarrollo', value: isDeveloper ? '✅ Autorizado' : '❌ No autorizado' },
                  { label: 'Entorno principal',  value: 'arcturus_main' },
                  { label: 'Auth Bridge',        value: 'Configurado (/api/sso)' },
                  { label: 'Nitro Main URL',     value: nitroUrl },
                  { label: 'Wallet endpoint',    value: '/api/hotel/wallet' },
                  { label: 'Entorno dev',        value: 'arcturus_dev' },
                  { label: 'Auth Bridge Dev',    value: 'Configurado (/api/dev/sso)' },
                  { label: 'Nitro Dev URL',      value: process.env['NEXT_PUBLIC_NITRO_DEV_URL'] ?? 'http://localhost:8082' },
                  { label: 'WS Dev',             value: 'ws://localhost:2097' },
                  { label: 'Beta hotel flag',    value: betaEnabled ? 'true' : 'false (deshabilitado)' },
                  { label: 'Dev hotel flag',     value: devEnabled  ? 'true' : 'false (deshabilitado)' },
                ].map(item => (
                  <div
                    key={item.label}
                    style={{
                      background:   'rgba(11,19,34,.8)',
                      border:       '1px solid #1a2540',
                      borderRadius: 8,
                      padding:      '0.625rem 0.75rem',
                    }}
                  >
                    <div className="text-xs mb-0.5" style={{ color: '#475569' }}>{item.label}</div>
                    <div className="text-xs font-mono" style={{ color: '#94A3B8', wordBreak: 'break-all' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center pb-2">
          <Link href="/hotel" style={{ color: '#334155', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← Volver al Hotel Principal
          </Link>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="px-6 py-3 flex items-center justify-between text-xs font-mono"
        style={{ borderTop: `1px solid ${AMBER_BORDER}`, color: '#334155' }}
      >
        <span>© 2025 Kodexa Hotel · /desarrollo gateway v1.0</span>
        <span className="flex items-center gap-1.5">
          <Globe className="w-3 h-3" style={{ color: AMBER }} />
          <span style={{ color: AMBER }}>dev zone</span>
        </span>
      </div>
    </div>
  );
}
