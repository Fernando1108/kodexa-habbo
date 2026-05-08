import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Award } from 'lucide-react';

export const metadata = { title: 'Mis Badges · Kodexa Hotel' };

export default async function BadgesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/badges');

  const user = await prisma.user.findUnique({
    where: { username: session.user.username },
    include: { badges: { orderBy: { slotNumber: 'asc' } } },
  });

  const badges = user?.badges ?? [];
  const equipped = badges.filter(b => b.slotNumber > 0).sort((a, b) => a.slotNumber - b.slotNumber);
  const inventory = badges.filter(b => b.slotNumber === 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
          <Award size={18} className="text-[#F59E0B]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Mis Badges</h1>
          <p className="text-sm text-[#94A3B8]">{badges.length} badges en total</p>
        </div>
      </div>

      {/* Equipped */}
      <div className="card mb-6">
        <h2 className="font-semibold text-[#F8FAFC] mb-4">Badges equipados (máx. 5)</h2>
        <div className="flex gap-3 flex-wrap">
          {equipped.length === 0 && (
            <p className="text-sm text-[#475569]">No tienes badges equipados. Equipa hasta 5 badges desde el hotel.</p>
          )}
          {equipped.map(b => (
            <div
              key={b.id}
              className="w-16 h-16 rounded-xl flex items-center justify-center text-center"
              style={{ background: '#0F172A', border: '1px solid #F59E0B30' }}
              title={b.badgeCode}
            >
              <div>
                <div className="text-xs font-bold font-mono text-[#F59E0B]">{b.badgeCode}</div>
                <div className="text-[10px] text-[#475569]">slot {b.slotNumber}</div>
              </div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 5 - equipped.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ background: '#0F172A', border: '1px dashed #1f2b41' }}
            >
              <span className="text-[#334155] text-lg">+</span>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory */}
      <div className="card">
        <h2 className="font-semibold text-[#F8FAFC] mb-4">Colección ({inventory.length})</h2>
        {inventory.length === 0 ? (
          <p className="text-sm text-[#475569]">
            No tienes badges en tu inventario. Participa en eventos y actividades para ganar badges.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {inventory.map(b => (
              <div
                key={b.id}
                className="aspect-square rounded-xl flex items-center justify-center"
                style={{ background: '#0F172A', border: '1px solid #1f2b41' }}
                title={b.badgeCode}
              >
                <span className="text-xs font-bold font-mono text-[#94A3B8]">{b.badgeCode}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-[#334155] mt-4">
        Para equipar o cambiar el orden de tus badges, usa el menú de perfil dentro del hotel.
      </p>
    </main>
  );
}
