import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-surface-2/60 bg-bg">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-10">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="logo-k"><span>K</span></div>
              <div className="leading-tight">
                <div className="font-bold tracking-tight">Kodexa<span className="text-primary">.</span></div>
                <div className="text-[10px] uppercase tracking-[.22em] text-muted font-mono">Hotel</div>
              </div>
            </Link>
            <p className="mt-5 text-sm text-muted max-w-xs leading-relaxed">
              El hotel virtual de nueva generación. Construye, comercia, crea — desde cualquier dispositivo.
            </p>
            <div className="mt-6 flex gap-2">
              {/* Discord */}
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-surface-2 hover:border-primary hover:text-primary text-muted flex items-center justify-center transition"
                title="Discord">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.27 5.33A18.06 18.06 0 0 0 14.97 4l-.2.39c1.5.34 2.85.93 4.18 1.86A14.4 14.4 0 0 0 9 6.25c-1.78.13-3.6.5-5.27 1.08l-.2-.39c1.32-.4 2.78-.7 4.3-.93C5.95 5.32 4.4 5.66 3 6.13 1.13 9.36.32 12.86.07 16.36c1.7 1.25 3.36 2.05 5 2.55l.65-.92c-.93-.34-1.78-.78-2.6-1.36.22-.16.44-.3.65-.46 3.39 1.6 7.05 1.6 10.4 0 .21.16.43.3.65.46-.82.58-1.7 1.02-2.61 1.36l.65.92c1.64-.5 3.3-1.3 5-2.55-.4-4.05-1.27-7.55-3.59-11.06zM8.52 14.5c-.98 0-1.79-.92-1.79-2.05s.79-2.05 1.79-2.05 1.81.92 1.79 2.05c.02 1.13-.79 2.05-1.79 2.05zm6.96 0c-.98 0-1.79-.92-1.79-2.05s.79-2.05 1.79-2.05 1.81.92 1.79 2.05c0 1.13-.79 2.05-1.79 2.05z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-surface-2 hover:border-primary hover:text-primary text-muted flex items-center justify-center transition"
                title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-surface-2 hover:border-primary hover:text-primary text-muted flex items-center justify-center transition"
                title="X / Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L1.254 2.25H8.08l4.261 5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a href="#" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg border border-surface-2 hover:border-primary hover:text-primary text-muted flex items-center justify-center transition"
                title="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.73a8.28 8.28 0 0 0 4.85 1.56V6.84a4.85 4.85 0 0 1-1.08-.15z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Hotel */}
          <div>
            <div className="text-xs uppercase tracking-[.18em] text-muted/80 font-mono mb-4">Hotel</div>
            <ul className="space-y-2.5">
              <li><Link className="foot-link" href="/hotel">Jugar ahora</Link></li>
              <li><Link className="foot-link" href="/marketplace">Marketplace</Link></li>
              <li><a className="foot-link" href="#">Catálogo</a></li>
              <li><a className="foot-link" href="#">Wired Visual</a></li>
            </ul>
          </div>

          {/* Comunidad */}
          <div>
            <div className="text-xs uppercase tracking-[.18em] text-muted/80 font-mono mb-4">Comunidad</div>
            <ul className="space-y-2.5">
              <li><a className="foot-link" href="#">Foros</a></li>
              <li><a className="foot-link" href="#">Discord</a></li>
              <li><Link className="foot-link" href="/community/rankings">Rankings</Link></li>
              <li><a className="foot-link" href="#">Eventos</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-xs uppercase tracking-[.18em] text-muted/80 font-mono mb-4">Legal</div>
            <ul className="space-y-2.5">
              <li><a className="foot-link" href="#">Términos</a></li>
              <li><a className="foot-link" href="#">Privacidad</a></li>
              <li><a className="foot-link" href="#">Cookies</a></li>
              <li><a className="foot-link" href="#">DMCA</a></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <div className="text-xs uppercase tracking-[.18em] text-muted/80 font-mono mb-4">Soporte</div>
            <ul className="space-y-2.5">
              <li><a className="foot-link" href="#">Centro de ayuda</a></li>
              <li><a className="foot-link" href="#">Reportar bug</a></li>
              <li><a className="foot-link" href="#">Estado del servidor</a></li>
              <li><a className="foot-link" href="#">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-surface-2/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted">
          <div>© 2025 Kodexa Hotel — Powered by <a href="https://www.kodexasolutions.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-primary transition-colors">Kodexa Solutions</a></div>
          <div className="font-mono flex items-center gap-2">
            <span className="pulse-dot" /> servers operational · v0.9.0-beta
          </div>
        </div>
      </div>
    </footer>
  );
}
