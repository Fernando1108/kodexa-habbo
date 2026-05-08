import { Camera } from 'lucide-react';

export const metadata = { title: 'Fotos · Kodexa Hotel' };

const PLACEHOLDERS = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  gradient: [
    'from-primary/10 to-secondary/10',
    'from-secondary/10 to-accent/10',
    'from-accent/10 to-primary/10',
    'from-primary/10 to-accent/10',
    'from-secondary/10 to-primary/10',
    'from-accent/10 to-secondary/10',
  ][i] ?? 'from-primary/10 to-secondary/10',
}));

export default function PhotosPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Camera size={18} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Galería de Fotos</h1>
          <p className="text-xs text-[#94A3B8]">Capturas de la comunidad</p>
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="card text-center py-10 mb-8 border-dashed">
        <Camera size={48} className="text-[#334155] mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-[#F8FAFC] mb-2">Próximamente</h2>
        <p className="text-sm text-[#94A3B8] max-w-md mx-auto leading-relaxed">
          Pronto podrás ver y compartir screenshots del hotel.
          ¡Toma fotos dentro del juego con el comando <code className="text-primary font-mono">:photo</code>!
        </p>
      </div>

      {/* Placeholder grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLACEHOLDERS.map(p => (
          <div key={p.id}
            className={`h-44 rounded-xl bg-gradient-to-br ${p.gradient} border border-[#1f2b41] flex items-center justify-center`}>
            <Camera size={28} className="text-[#334155]" />
          </div>
        ))}
      </div>
    </main>
  );
}
