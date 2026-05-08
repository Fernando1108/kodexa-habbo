import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Users, UserPlus, MessageCircle, Search } from 'lucide-react';

export const metadata = { title: 'Amigos · Kodexa Hotel' };

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/friends');

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#F8FAFC]">Amigos</h1>
          <p className="text-sm text-[#94A3B8]">Gestiona tus amigos dentro del hotel</p>
        </div>
        <button className="btn btn-primary py-2 px-4 text-sm flex items-center gap-2 cursor-not-allowed opacity-60" disabled>
          <UserPlus size={14} /> Añadir amigo
        </button>
      </div>

      {/* Coming soon */}
      <div className="card text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto mb-4">
          <Users size={28} className="text-secondary" />
        </div>
        <h2 className="text-lg font-bold text-[#F8FAFC] mb-2">Sistema de amigos</h2>
        <p className="text-sm text-[#94A3B8] max-w-sm mx-auto mb-6">
          El sistema de amigos se gestiona dentro del hotel. Conéctate y añade amigos desde el cliente del juego.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <a href="/hotel" className="btn btn-primary py-2 px-5 text-sm flex items-center gap-2">
            <Users size={14} /> Ir al hotel
          </a>
          <button disabled className="btn btn-outline py-2 px-5 text-sm flex items-center gap-2 opacity-50 cursor-not-allowed">
            <Search size={14} /> Buscar amigos
          </button>
        </div>
      </div>

      {/* Placeholder friend requests */}
      <div className="card mt-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={16} className="text-primary" />
          <h2 className="font-semibold text-[#F8FAFC]">Solicitudes pendientes</h2>
        </div>
        <p className="text-sm text-[#475569]">No tienes solicitudes de amistad pendientes.</p>
      </div>
    </main>
  );
}
