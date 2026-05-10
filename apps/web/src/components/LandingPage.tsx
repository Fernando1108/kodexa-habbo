'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Play, UserPlus, ShieldCheck, Smartphone, Sparkles,
  ChevronDown, Menu, Zap, Store, BrainCircuit, Cable, Palette,
  Coins, Activity, UsersRound, Home, Package, Rocket, Film,
  Gem, Trophy, ArrowUpRight, Newspaper, ChevronRight,
} from 'lucide-react';
import Footer from '@/components/Footer';

// ─── CountUp ────────────────────────────────────────────
function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.unobserve(el);
      const duration = 1600;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.floor(target * eased).toLocaleString('en-US');
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString('en-US');
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return <span ref={ref}>0</span>;
}

// ─── FeatCard ────────────────────────────────────────────
interface FeatCardProps {
  num: string;
  delay?: number;
  iconStyle?: React.CSSProperties;
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}

function FeatCard({ num, delay, iconStyle, icon, title, description, children }: FeatCardProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.unobserve(el); }
    }, { threshold: 0.12 });
    io.observe(el);
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    };
    el.addEventListener('mousemove', onMove);
    return () => { io.disconnect(); el.removeEventListener('mousemove', onMove); };
  }, []);

  return (
    <article ref={ref} className="reveal feat-card" data-delay={delay}>
      <div className="num">{num}</div>
      <div className="feat-icon" style={iconStyle}>{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>
      {children}
    </article>
  );
}

// ─── Types ───────────────────────────────────────────────
export interface LandingNewsItem {
  id:       number;
  slug:     string | null;
  title:    string;
  excerpt:  string;
  imageUrl: string;
  date:     string; // ISO string
}

export interface LandingStats {
  onlineUsers:  number;
  totalRooms:   number;
  totalFurniture: number;
  totalUsers:   number;
  latestNews:   LandingNewsItem[];
}

// ─── Date helper (stable, no hydration risk) ─────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function LandingPage({ onlineUsers, totalRooms, totalFurniture, totalUsers, latestNews }: LandingStats) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reveal observer for all non-FeatCard .reveal elements
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal:not(.feat-card)').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* =================== NAVBAR =================== */}
      <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300${scrolled ? ' nav-blur' : ''}`}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="logo-k"><span>K</span></div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">Kodexa<span className="text-primary">.</span></div>
              <div className="text-[10px] uppercase tracking-[.22em] text-muted font-mono">Hotel</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a className="nav-link active" href="#hero">Inicio</a>
            <a className="nav-link" href="#features">El Hotel</a>
            <a className="nav-link" href="#news">Noticias</a>
            <a className="nav-link" href="/community/rankings">Comunidad</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="btn btn-outline">Iniciar Sesión</Link>
            <Link href="/register" className="btn btn-primary">
              Registrarse
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg border border-surface-2 text-muted"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden border-t border-surface-2 bg-bg/95 backdrop-blur-lg${mobileOpen ? '' : ' hidden'}`}>
          <div className="px-5 py-5 flex flex-col gap-4">
            <a className="nav-link" href="#hero">Inicio</a>
            <a className="nav-link" href="#features">El Hotel</a>
            <a className="nav-link" href="#news">Noticias</a>
            <a className="nav-link" href="/community/rankings">Comunidad</a>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link href="/login" className="btn btn-outline justify-center">Iniciar Sesión</Link>
              <Link href="/register" className="btn btn-primary justify-center">Registrarse</Link>
            </div>
          </div>
        </div>
      </header>

      {/* =================== HERO =================== */}
      <section id="hero" className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden">
        <div className="aurora a" />
        <div className="aurora b" />
        <div className="aurora c" />
        <div className="stars twinkle" />
        <div className="grid-floor" />

        <div className="relative max-w-7xl mx-auto w-full px-5 lg:px-8 grid lg:grid-cols-[1.1fr_.9fr] gap-14 items-center">
          {/* copy */}
          <div>
            <div className="reveal eyebrow"><span className="pulse-dot" /> Beta abierta · Temporada 1</div>

            <h1
              className="reveal hero-title mt-7 font-extrabold tracking-tight leading-[.95]"
              style={{ fontSize: 'clamp(3.4rem, 7.5vw, 6.4rem)' }}
              data-delay="1"
            >
              <span className="block text-gradient">Kodexa Hotel</span>
              <span className="block text-white/95 text-[.62em] font-semibold mt-3 tracking-tight">
                el hotel virtual de <span className="italic text-muted">nueva generación</span>.
              </span>
            </h1>

            <p className="reveal mt-7 max-w-xl text-lg text-muted leading-relaxed" data-delay="2">
              Marketplace real, NPCs con IA y un editor visual de juegos en una sola plataforma.
              Construye salas, cráftea muebles, comercia con otros jugadores — todo desde el navegador o tu celular.
            </p>

            <div className="reveal mt-9 flex flex-wrap gap-3" data-delay="3">
              <Link href="/hotel" className="cta-halo btn btn-primary btn-lg">
                <Play className="w-5 h-5" />
                Entrar al Hotel
              </Link>
              <Link href="/register" className="btn btn-outline btn-lg">
                Crear Cuenta Gratis
                <UserPlus className="w-4 h-4" />
              </Link>
            </div>

            <div className="reveal mt-10 flex items-center gap-6 text-sm text-muted" data-delay="4">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" />Sin descargas</div>
              <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" />Mobile ready</div>
              <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Gratis para siempre</div>
            </div>
          </div>

          {/* scene mock */}
          <div className="reveal" data-delay="2">
            <div className="scene-card">
              {/* title row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-danger/80" />
                    <span className="w-3 h-3 rounded-full bg-accent/80" />
                    <span className="w-3 h-3 rounded-full bg-success/80" />
                  </div>
                  <div className="ml-3 text-xs font-mono text-muted">/sala/club-kodexa</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="pulse-dot" /> 24 online
                </div>
              </div>

              {/* isometric room */}
              <div
                className="relative h-[300px] rounded-xl border border-surface-2 overflow-hidden"
                style={{ background: 'radial-gradient(circle at 50% 35%, #1a2540 0%, #0a1024 80%)' }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="grid grid-cols-6 gap-[2px]"
                    style={{ transform: 'perspective(700px) rotateX(58deg) rotateZ(45deg)' }}
                  >
                    {Array.from({ length: 36 }, (_, i) => <div key={i} className="iso-tile" />)}
                  </div>
                </div>

                {/* avatars */}
                <div className="absolute left-[38%] top-[38%]">
                  <div className="w-9 h-12 rounded-md bg-gradient-to-b from-primary to-primary-dim shadow-glow-sm" />
                  <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded bg-bg/80 border border-surface-2 text-center font-mono">Nova</div>
                </div>
                <div className="absolute left-[55%] top-[44%]">
                  <div className="w-9 h-12 rounded-md bg-gradient-to-b from-secondary to-secondary/60" style={{ boxShadow: '0 0 20px -4px rgba(124,58,237,.7)' }} />
                  <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded bg-bg/80 border border-surface-2 text-center font-mono">Zyrx</div>
                </div>
                <div className="absolute left-[28%] top-[55%]">
                  <div className="w-9 h-12 rounded-md bg-gradient-to-b from-accent to-accent/60" style={{ boxShadow: '0 0 20px -4px rgba(245,158,11,.7)' }} />
                  <div className="text-[10px] mt-1 px-1.5 py-0.5 rounded bg-bg/80 border border-surface-2 text-center font-mono">Echo</div>
                </div>

                {/* chat bubble */}
                <div className="absolute right-4 bottom-4 max-w-[60%] bg-surface/90 backdrop-blur border border-surface-2 rounded-xl px-3 py-2">
                  <div className="text-[11px] font-mono text-primary mb-0.5">Nova:</div>
                  <div className="text-xs text-white/90">¿alguien quiere construir un casino con wired? 🎰</div>
                </div>
              </div>

              {/* HUD */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg/70 border border-surface-2">
                  <Coins className="w-4 h-4 text-accent" />
                  <div><div className="text-muted text-[10px]">Créditos</div><div className="font-bold">12,840</div></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg/70 border border-surface-2">
                  <Gem className="w-4 h-4 text-secondary" />
                  <div><div className="text-muted text-[10px]">Diamantes</div><div className="font-bold">42</div></div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg/70 border border-surface-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <div><div className="text-muted text-[10px]">Nivel</div><div className="font-bold">Lv 24</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted text-xs flex flex-col items-center gap-2 opacity-70">
          <span className="font-mono tracking-widest">SCROLL</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* =================== MARQUEE =================== */}
      <section className="relative border-y border-surface-2/60 bg-bg/40 py-5 overflow-hidden">
        <div className="marquee whitespace-nowrap text-muted/70 font-mono text-xs uppercase tracking-[.3em] flex">
          <div className="flex gap-12 px-6 shrink-0">
            <span>★ 36,000+ muebles en catálogo</span>
            <span>★ 187 oficios desbloqueables</span>
            <span>★ NPCs con memoria persistente</span>
            <span>★ Subastas 24/7</span>
            <span>★ Wired Visual editor</span>
            <span>★ Servidores en LATAM, EU y NA</span>
          </div>
          <div className="flex gap-12 px-6 shrink-0" aria-hidden="true">
            <span>★ 36,000+ muebles en catálogo</span>
            <span>★ 187 oficios desbloqueables</span>
            <span>★ NPCs con memoria persistente</span>
            <span>★ Subastas 24/7</span>
            <span>★ Wired Visual editor</span>
            <span>★ Servidores en LATAM, EU y NA</span>
          </div>
        </div>
      </section>

      {/* =================== FEATURES =================== */}
      <section id="features" className="relative py-28">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="max-w-3xl">
            <div className="reveal eyebrow"><Zap className="w-3 h-3" /> Lo que nos hace únicos</div>
            <h2 className="reveal mt-5 text-4xl md:text-5xl font-bold tracking-tight" data-delay="1">
              No es otro retro.<br />Es el <span className="text-gradient">próximo capítulo</span>.
            </h2>
            <p className="reveal mt-5 text-muted text-lg max-w-2xl" data-delay="2">
              Tomamos lo mejor del Habbo clásico y lo combinamos con economía moderna, IA y herramientas pensadas para creadores.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* F/01 Marketplace */}
            <FeatCard num="F/01" delay={1} icon={<Store className="w-5 h-5" />} title="Marketplace Real" description="Compra, vende y subasta muebles entre jugadores con precios dinámicos en tiempo real.">
              <div className="mt-5 flex items-center justify-between text-xs font-mono">
                <span className="text-muted">+12,400 trades / día</span>
                <span className="text-primary flex items-center gap-1">Explorar <ArrowUpRight className="w-3 h-3" /></span>
              </div>
            </FeatCard>

            {/* F/02 IA */}
            <FeatCard
              num="F/02" delay={2}
              icon={<BrainCircuit className="w-5 h-5" />}
              iconStyle={{ color: '#C4B5FD', borderColor: 'rgba(124,58,237,.35)', background: 'linear-gradient(135deg, rgba(124,58,237,.22), rgba(0,212,170,.12))' }}
              title="IA Integrada"
              description="NPCs que recuerdan, moderación automática y un asistente que te guía por el hotel."
            >
              <div className="mt-5 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-surface-2 text-muted">npcs</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-surface-2 text-muted">moderation</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-surface-2 text-muted">assistant</span>
              </div>
            </FeatCard>

            {/* F/03 Wired */}
            <FeatCard
              num="F/03" delay={3}
              icon={<Cable className="w-5 h-5" />}
              iconStyle={{ color: '#FCD34D', borderColor: 'rgba(245,158,11,.35)', background: 'linear-gradient(135deg, rgba(245,158,11,.22), rgba(124,58,237,.12))' }}
              title="Wired Visual"
              description="Editor de nodos tipo Blueprints. Arrastra triggers y acciones para construir minijuegos sin código."
            >
              <div className="mt-5 h-12 rounded-md border border-surface-2 bg-bg/60 flex items-center px-2 gap-2 overflow-hidden">
                <div className="px-2 py-1 rounded bg-primary/15 border border-primary/30 text-[10px] font-mono text-primary">onClick</div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/60 to-secondary/60" />
                <div className="px-2 py-1 rounded bg-secondary/15 border border-secondary/30 text-[10px] font-mono text-secondary">teleport</div>
                <div className="flex-1 h-px bg-gradient-to-r from-secondary/60 to-accent/60" />
                <div className="px-2 py-1 rounded bg-accent/15 border border-accent/30 text-[10px] font-mono text-accent">reward</div>
              </div>
            </FeatCard>

            {/* F/04 Mobile */}
            <FeatCard num="F/04" delay={1} icon={<Smartphone className="w-5 h-5" />} title="Mobile First" description="PWA instalable en iOS y Android. Mismas features, controles táctiles repensados.">
              <div className="mt-5 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-bg/60 border border-surface-2 font-mono">iOS</span>
                <span className="px-2 py-1 rounded bg-bg/60 border border-surface-2 font-mono">Android</span>
                <span className="px-2 py-1 rounded bg-bg/60 border border-surface-2 font-mono">Web</span>
              </div>
            </FeatCard>

            {/* F/05 Custom */}
            <FeatCard
              num="F/05" delay={2}
              icon={<Palette className="w-5 h-5" />}
              iconStyle={{ color: '#5BFFD7' }}
              title="Personalización Total"
              description="Muebles custom, themes de sala y partículas. Tu hotel se ve como tú quieres."
            >
              <div className="mt-5 flex gap-1.5">
                <span className="w-6 h-6 rounded-md bg-primary" />
                <span className="w-6 h-6 rounded-md bg-secondary" />
                <span className="w-6 h-6 rounded-md bg-accent" />
                <span className="w-6 h-6 rounded-md bg-danger" />
                <span className="w-6 h-6 rounded-md bg-success" />
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-primary via-secondary to-accent" />
              </div>
            </FeatCard>

            {/* F/06 Economy */}
            <FeatCard
              num="F/06" delay={3}
              icon={<Coins className="w-5 h-5" />}
              iconStyle={{ color: '#F59E0B', borderColor: 'rgba(245,158,11,.35)', background: 'linear-gradient(135deg, rgba(245,158,11,.22), rgba(0,212,170,.1))' }}
              title="Economía Avanzada"
              description="Crafting, oficios, reputación y logros. Cada acción suma a tu progreso real."
            >
              <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="px-2 py-1 rounded bg-bg/60 border border-surface-2 text-center">
                  <div className="text-muted">crédits</div><div className="text-accent font-bold mt-0.5">12.8K</div>
                </div>
                <div className="px-2 py-1 rounded bg-bg/60 border border-surface-2 text-center">
                  <div className="text-muted">rep</div><div className="text-primary font-bold mt-0.5">1234</div>
                </div>
                <div className="px-2 py-1 rounded bg-bg/60 border border-surface-2 text-center">
                  <div className="text-muted">trades</div><div className="text-secondary font-bold mt-0.5">+67</div>
                </div>
              </div>
            </FeatCard>
          </div>
        </div>
      </section>

      {/* =================== STATS =================== */}
      <section id="stats" className="relative py-24 border-t border-surface-2/50">
        <div className="absolute inset-0 -z-10">
          <div className="aurora a" style={{ left: 'auto', right: '-200px', top: 'auto', bottom: '-200px', opacity: .3 }} />
        </div>

        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="reveal eyebrow mx-auto"><Activity className="w-3 h-3" /> En tiempo real</div>
            <h2 className="reveal mt-5 text-3xl md:text-4xl font-bold tracking-tight" data-delay="1">
              Vivo. Ahora mismo.
            </h2>
          </div>

          <div className="reveal mt-12 grid grid-cols-2 md:grid-cols-4 gap-4" data-delay="2">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <UsersRound className="w-5 h-5 text-primary" />
                <span className="pulse-dot" />
              </div>
              <div className="mt-4 text-4xl font-bold tracking-tight">
                <CountUp target={onlineUsers} />
              </div>
              <div className="mt-1 text-xs text-muted uppercase tracking-wider">Jugadores online</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <Home className="w-5 h-5 text-secondary" />
              </div>
              <div className="mt-4 text-4xl font-bold tracking-tight">
                <CountUp target={totalRooms} />
              </div>
              <div className="mt-1 text-xs text-muted uppercase tracking-wider">Salas creadas</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <div className="mt-4 text-4xl font-bold tracking-tight">
                <CountUp target={totalFurniture} /><span className="text-accent">+</span>
              </div>
              <div className="mt-1 text-xs text-muted uppercase tracking-wider">Muebles disponibles</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <UserPlus className="w-5 h-5 text-success" />
              </div>
              <div className="mt-4 text-4xl font-bold tracking-tight">
                <CountUp target={totalUsers} />
              </div>
              <div className="mt-1 text-xs text-muted uppercase tracking-wider">Usuarios registrados</div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== NEWS =================== */}
      <section id="news" className="relative py-24 border-t border-surface-2/50">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div className="max-w-xl">
              <div className="reveal eyebrow"><Newspaper className="w-3 h-3" /> Del hotel</div>
              <h2 className="reveal mt-5 text-3xl md:text-4xl font-bold tracking-tight" data-delay="1">
                Últimas <span className="text-gradient">noticias</span>
              </h2>
            </div>
            <Link
              href="/community/news"
              className="reveal hidden md:flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
              data-delay="1"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {latestNews.length > 0 ? (
            <div className="reveal grid md:grid-cols-3 gap-5" data-delay="2">
              {latestNews.map(n => {
                const href = n.slug ? `/community/news/${n.slug}` : '/community/news';
                return (
                  <Link
                    key={n.id}
                    href={href}
                    className="group relative rounded-2xl border border-surface-2 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 flex flex-col"
                    style={{ background: 'linear-gradient(180deg, #131c33 0%, #0e1628 100%)' }}
                  >
                    {/* Image */}
                    <div className="relative h-40 overflow-hidden flex-none bg-surface">
                      {n.imageUrl ? (
                        <img
                          src={n.imageUrl}
                          alt={n.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: 'radial-gradient(circle at 50% 40%, rgba(0,212,170,.12), transparent 70%)' }}>
                          <Newspaper className="w-10 h-10 text-surface-2" />
                        </div>
                      )}
                      {/* overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1628]/80 to-transparent pointer-events-none" />
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-[11px] font-mono text-muted uppercase tracking-[.15em] mb-2">
                        {formatDate(n.date)}
                      </p>
                      <h3 className="font-semibold text-[#F8FAFC] text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {n.title}
                      </h3>
                      {n.excerpt && (
                        <p className="text-xs text-muted leading-relaxed line-clamp-3 flex-1">
                          {n.excerpt}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-1 text-xs text-primary font-medium">
                        Leer más <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="reveal text-center py-16 rounded-2xl border border-surface-2/60" data-delay="2"
              style={{ background: 'linear-gradient(180deg, #131c33 0%, #0e1628 100%)' }}>
              <Newspaper className="w-10 h-10 text-surface-2 mx-auto mb-3" />
              <p className="text-muted text-sm">Próximas noticias en camino. ¡Vuelve pronto!</p>
            </div>
          )}

          <div className="mt-6 text-center md:hidden">
            <Link href="/community/news" className="text-sm text-primary hover:underline font-medium">
              Ver todas las noticias →
            </Link>
          </div>
        </div>
      </section>

      {/* =================== CTA =================== */}
      <section id="cta" className="relative py-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 lg:px-8">
          <div
            className="reveal relative rounded-3xl p-10 md:p-16 text-center overflow-hidden border border-surface-2"
            style={{
              background: `
                radial-gradient(circle at 20% 0%, rgba(0,212,170,.25), transparent 55%),
                radial-gradient(circle at 80% 100%, rgba(124,58,237,.28), transparent 55%),
                linear-gradient(180deg, #131c33, #0e1628)
              `,
            }}
          >
            {/* decorative grid */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              }}
            />

            <div className="relative">
              <div className="eyebrow mx-auto"><Rocket className="w-3 h-3" /> Tu cuenta te espera</div>
              <h2 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">
                ¿Listo para <span className="text-gradient">entrar</span>?
              </h2>
              <p className="mt-5 max-w-xl mx-auto text-muted text-lg">
                {totalUsers.toLocaleString('en-US')} jugadores ya están dentro construyendo, comerciando y creando minijuegos.
                Únete en menos de 30 segundos.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/hotel" className="cta-halo btn btn-primary btn-lg">
                  <Play className="w-5 h-5" />
                  Jugar Ahora — Es Gratis
                </Link>
                <a href="#features" className="btn btn-outline btn-lg">
                  Ver Features <Film className="w-4 h-4" />
                </a>
              </div>
              <div className="mt-7 text-xs text-muted font-mono uppercase tracking-[.2em]">
                · sin tarjeta · sin descargas · cancelable cuando quieras ·
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
