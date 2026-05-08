import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Home, Users, Lock, Globe } from 'lucide-react';

export const metadata = { title: 'Mis Salas · Kodexa Hotel' };

export default async function MyRoomsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/rooms');

  const rooms = await prisma.room.findMany({
    where: { ownerName: session.user.username },
    orderBy: { score: 'desc' },
  });

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Mis Salas</h1>
          <p className="text-sm text-[#94A3B8]">{rooms.length} sala{rooms.length !== 1 ? 's' : ''} creada{rooms.length !== 1 ? 's' : ''}</p>
        </div>
        <a
          href="/hotel"
          className="btn btn-primary py-2 px-4 text-sm flex items-center gap-2"
        >
          <Home size={14} /> Crear sala en el hotel
        </a>
      </div>

      {rooms.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Home size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-[#F8FAFC] mb-2">Sin salas todavía</h2>
          <p className="text-sm text-[#94A3B8] max-w-sm mx-auto mb-6">
            Crea tu primera sala personalizada dentro del hotel. Puedes decorarla, invitar amigos y hacer eventos.
          </p>
          <a href="/hotel" className="btn btn-primary py-2 px-5 text-sm inline-flex items-center gap-2">
            <Home size={14} /> Entrar al hotel
          </a>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="card hover:border-primary/30 transition-colors cursor-pointer">
              {/* Room preview placeholder */}
              <div
                className="w-full h-28 rounded-xl mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}
              >
                <Home size={32} className="text-[#334155]" />
              </div>

              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-[#F8FAFC] text-sm truncate">{room.name}</h2>
                <div title={room.state === 'open' ? 'Pública' : 'Privada'}>
                  {room.state === 'open'
                    ? <Globe size={14} className="text-[#10B981] flex-none" />
                    : <Lock size={14} className="text-[#F59E0B] flex-none" />
                  }
                </div>
              </div>

              {room.description && (
                <p className="text-xs text-[#475569] mb-3 line-clamp-2">{room.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-[#475569]">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>máx {room.maxUsers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>★ {room.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
