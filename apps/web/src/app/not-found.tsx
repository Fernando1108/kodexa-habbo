import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Big 404 */}
        <div className="relative mb-6">
          <div
            className="text-[120px] font-black leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, #00D4AA20, #7C3AED20)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'Sora, sans-serif',
            }}
          >
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-7xl font-black"
              style={{
                background: 'linear-gradient(135deg, #00D4AA, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#F8FAFC] mb-3">Página no encontrada</h1>
        <p className="text-sm text-[#94A3B8] mb-8 leading-relaxed">
          Parece que esta sala no existe o fue movida. Quizás el URL está mal o la página fue eliminada.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary py-2.5 px-6 text-sm">
            Volver al inicio
          </Link>
          <Link href="/hotel" className="btn btn-outline py-2.5 px-6 text-sm">
            Entrar al hotel
          </Link>
        </div>

        <div className="flex justify-center gap-2 mt-12">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === 2 ? 10 : 6,
                height: i === 2 ? 10 : 6,
                background: i === 2 ? '#00D4AA' : '#1E293B',
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
