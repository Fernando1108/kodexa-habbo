'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  Clock,
  Gavel,
  PackageOpen,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Tag,
} from 'lucide-react';

interface MarketplaceListing {
  id: number;
  price: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  user: { username: string };
  item: {
    id: number;
    itemBase: { publicName: string; spriteId: string };
  };
}

interface AuctionItem {
  id: number;
  startPrice: number;
  currentBid: number;
  status: string;
  endsAt: string;
  seller: { username: string };
  itemBase: { publicName: string; spriteId: string };
}

interface MyListing {
  id: number;
  price: number;
  status: string;
  createdAt: string;
  item: {
    id: number;
    itemBase: { publicName: string; spriteId: string };
  };
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function formatCredits(n: number) {
  return n.toLocaleString('es-ES') + ' créditos';
}

function formatTimeRemaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Finalizada';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatExpiry(expiresAt: string) {
  return new Date(expiresAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings' | 'auctions'>('browse');

  // Browse state
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('price_asc');
  const [loadingBrowse, setLoadingBrowse] = useState(false);

  // My listings state
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [myError, setMyError] = useState<string | null>(null);

  // Auctions state
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [bidState, setBidState] = useState<Record<number, { open: boolean; amount: string; loading: boolean }>>({});

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(message: string, type: 'success' | 'error') {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  // Fetch browse listings
  const fetchListings = useCallback(async (p: number, s: string, so: string) => {
    setLoadingBrowse(true);
    try {
      const res = await fetch(`/api/marketplace?page=${p}&search=${encodeURIComponent(s)}&sort=${so}`);
      const data = await res.json();
      setListings(data.listings ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      addToast('Error al cargar el marketplace', 'error');
    } finally {
      setLoadingBrowse(false);
    }
  }, []);

  // Fetch my listings
  const fetchMyListings = useCallback(async () => {
    setLoadingMy(true);
    setMyError(null);
    try {
      const res = await fetch('/api/marketplace/my-listings');
      if (res.status === 401) {
        setMyError('401');
        return;
      }
      const data = await res.json();
      setMyListings(data.listings ?? []);
    } catch {
      addToast('Error al cargar tus ventas', 'error');
    } finally {
      setLoadingMy(false);
    }
  }, []);

  // Fetch auctions
  const fetchAuctions = useCallback(async () => {
    setLoadingAuctions(true);
    try {
      const res = await fetch('/api/marketplace/auctions');
      const data = await res.json();
      setAuctions(data.auctions ?? []);
    } catch {
      addToast('Error al cargar subastas', 'error');
    } finally {
      setLoadingAuctions(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(page, search, sort);
  }, [fetchListings, page, sort]);

  useEffect(() => {
    if (activeTab === 'my-listings') fetchMyListings();
    if (activeTab === 'auctions') fetchAuctions();
  }, [activeTab, fetchMyListings, fetchAuctions]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchListings(1, search, sort);
  }

  async function handleBuy(id: number) {
    if (!confirm('¿Confirmar compra?')) return;
    try {
      const res = await fetch(`/api/marketplace/buy/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        addToast('Compra exitosa', 'success');
        fetchListings(page, search, sort);
      } else {
        addToast(data.error ?? 'Error al comprar', 'error');
      }
    } catch {
      addToast('Error de conexión', 'error');
    }
  }

  async function handleCancel(id: number) {
    try {
      const res = await fetch(`/api/marketplace/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        addToast('Listing retirado', 'success');
        fetchMyListings();
      } else {
        addToast(data.error ?? 'Error al retirar', 'error');
      }
    } catch {
      addToast('Error de conexión', 'error');
    }
  }

  function toggleBid(auctionId: number) {
    setBidState((prev) => ({
      ...prev,
      [auctionId]: {
        open: !prev[auctionId]?.open,
        amount: prev[auctionId]?.amount ?? '',
        loading: false,
      },
    }));
  }

  async function handleBid(auctionId: number) {
    const state = bidState[auctionId];
    const amount = parseInt(state?.amount ?? '0', 10);
    if (!amount || isNaN(amount)) {
      addToast('Ingresa un monto válido', 'error');
      return;
    }
    setBidState((prev) => ({ ...prev, [auctionId]: { ...prev[auctionId], loading: true } }));
    try {
      const res = await fetch(`/api/marketplace/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.ok) {
        addToast('Puja realizada', 'success');
        setBidState((prev) => ({ ...prev, [auctionId]: { open: false, amount: '', loading: false } }));
        fetchAuctions();
      } else {
        addToast(data.error ?? 'Error al pujar', 'error');
        setBidState((prev) => ({ ...prev, [auctionId]: { ...prev[auctionId], loading: false } }));
      }
    } catch {
      addToast('Error de conexión', 'error');
      setBidState((prev) => ({ ...prev, [auctionId]: { ...prev[auctionId], loading: false } }));
    }
  }

  const tabs = [
    { key: 'browse', label: 'Explorar', icon: Search },
    { key: 'my-listings', label: 'Mis Ventas', icon: Tag },
    { key: 'auctions', label: 'Subastas', icon: Gavel },
  ] as const;

  return (
    <main className="min-h-screen bg-[#0F172A] px-4 py-8">
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-[#F8FAFC] shadow-lg transition-all ${
              t.type === 'success' ? 'bg-[#10B981]' : 'bg-[#EF4444]'
            }`}
          >
            {t.type === 'success' ? '✓' : '✕'} {t.message}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="h-8 w-8 text-[#00D4AA]" />
            <h1 className="text-3xl font-bold text-[#F8FAFC]">Marketplace</h1>
          </div>
          <p className="text-[#94A3B8]">Compra y vende muebles entre jugadores</p>
          {total > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1E293B] px-4 py-1.5 text-sm text-[#94A3B8]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              <span className="text-[#F8FAFC] font-semibold">{total.toLocaleString('es-ES')}</span> listings activos
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-[#1E293B] p-1 w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-[#00D4AA] text-[#0F172A]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Filters */}
            <form onSubmit={handleSearchSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar muebles..."
                  className="w-full rounded-lg bg-[#1E293B] pl-10 pr-4 py-2.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8] border border-[#334155] focus:border-[#00D4AA] focus:outline-none"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="rounded-lg bg-[#1E293B] px-4 py-2.5 text-sm text-[#F8FAFC] border border-[#334155] focus:border-[#00D4AA] focus:outline-none"
              >
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="newest">Más recientes</option>
              </select>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-[#00D4AA] px-4 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-[#00bfa0] transition-colors"
              >
                <Search className="h-4 w-4" />
                Buscar
              </button>
            </form>

            {/* Listings grid */}
            {loadingBrowse ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-[#1E293B] h-44" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
                <PackageOpen className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-lg font-medium">No hay items en venta</p>
                <p className="text-sm mt-1">Intenta con otra búsqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col rounded-xl bg-[#1E293B] border border-[#334155] p-4 hover:border-[#00D4AA] transition-colors"
                  >
                    <div className="mb-2 flex items-center justify-center h-16 rounded-lg bg-[#0F172A]">
                      <ShoppingBag className="h-8 w-8 text-[#334155]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC] line-clamp-2 mb-1">
                      {listing.item.itemBase.publicName}
                    </h3>
                    <p className="text-xs text-[#94A3B8] mb-1">
                      Vendido por: <span className="text-[#F8FAFC]">{listing.user.username}</span>
                    </p>
                    <p className="text-sm font-bold text-[#F59E0B] mb-1">
                      {formatCredits(listing.price)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-[#94A3B8] mb-3">
                      <Clock className="h-3 w-3" />
                      <span>Expira {formatExpiry(listing.expiresAt)}</span>
                    </div>
                    <button
                      onClick={() => handleBuy(listing.id)}
                      className="mt-auto w-full rounded-lg bg-[#00D4AA] py-1.5 text-xs font-bold text-[#0F172A] hover:bg-[#00bfa0] transition-colors"
                    >
                      Comprar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg bg-[#1E293B] px-3 py-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <span className="text-sm text-[#94A3B8]">
                  Página <span className="text-[#F8FAFC] font-semibold">{page}</span> de {pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="flex items-center gap-1 rounded-lg bg-[#1E293B] px-3 py-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Listings Tab */}
        {activeTab === 'my-listings' && (
          <div>
            {loadingMy ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-[#1E293B] h-40" />
                ))}
              </div>
            ) : myError === '401' ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
                <Tag className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-lg font-medium">Inicia sesión para ver tus ventas</p>
              </div>
            ) : myListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
                <PackageOpen className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-lg font-medium">No tienes items en venta</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col rounded-xl bg-[#1E293B] border border-[#334155] p-4"
                  >
                    <div className="mb-2 flex items-center justify-center h-16 rounded-lg bg-[#0F172A]">
                      <ShoppingBag className="h-8 w-8 text-[#334155]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#F8FAFC] line-clamp-2 mb-1">
                      {listing.item.itemBase.publicName}
                    </h3>
                    <p className="text-sm font-bold text-[#F59E0B] mb-1">
                      {formatCredits(listing.price)}
                    </p>
                    <span
                      className={`mb-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium w-fit ${
                        listing.status === 'active'
                          ? 'bg-[#10B981]/20 text-[#10B981]'
                          : 'bg-[#94A3B8]/20 text-[#94A3B8]'
                      }`}
                    >
                      {listing.status}
                    </span>
                    <button
                      onClick={() => handleCancel(listing.id)}
                      className="mt-auto flex items-center justify-center gap-1 w-full rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 py-1.5 text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Retirar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Auctions Tab */}
        {activeTab === 'auctions' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#F8FAFC]">Subastas activas</h2>
              <button
                onClick={fetchAuctions}
                disabled={loadingAuctions}
                className="flex items-center gap-2 rounded-lg bg-[#1E293B] px-3 py-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loadingAuctions ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            {loadingAuctions ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-[#1E293B] h-52" />
                ))}
              </div>
            ) : auctions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
                <Gavel className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-lg font-medium">No hay subastas activas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {auctions.map((auction) => {
                  const bid = bidState[auction.id];
                  return (
                    <div
                      key={auction.id}
                      className="flex flex-col rounded-xl bg-[#1E293B] border border-[#334155] p-4 hover:border-[#7C3AED] transition-colors"
                    >
                      <div className="mb-3 flex items-center justify-center h-16 rounded-lg bg-[#0F172A]">
                        <Gavel className="h-8 w-8 text-[#334155]" />
                      </div>
                      <h3 className="text-sm font-semibold text-[#F8FAFC] line-clamp-1 mb-1">
                        {auction.itemBase.publicName}
                      </h3>
                      <p className="text-xs text-[#94A3B8] mb-2">
                        Vendedor: <span className="text-[#F8FAFC]">{auction.seller.username}</span>
                      </p>
                      <div className="mb-2 flex items-center justify-between text-xs text-[#94A3B8]">
                        <span>Inicio: <span className="text-[#F8FAFC]">{formatCredits(auction.startPrice)}</span></span>
                      </div>
                      <div className="mb-2 rounded-lg bg-[#0F172A] px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-[#94A3B8]">Puja actual</span>
                        <span className="text-sm font-bold text-[#F59E0B]">{formatCredits(auction.currentBid)}</span>
                      </div>
                      <div className="mb-3 flex items-center gap-1 text-xs text-[#94A3B8]">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeRemaining(auction.endsAt)}</span>
                      </div>

                      {bid?.open ? (
                        <div className="mt-auto flex flex-col gap-2">
                          <input
                            type="number"
                            min={auction.currentBid + 1}
                            value={bid.amount}
                            onChange={(e) =>
                              setBidState((prev) => ({
                                ...prev,
                                [auction.id]: { ...prev[auction.id], amount: e.target.value },
                              }))
                            }
                            placeholder={`Mín. ${auction.currentBid + 1}`}
                            className="w-full rounded-lg bg-[#0F172A] px-3 py-2 text-sm text-[#F8FAFC] border border-[#334155] focus:border-[#7C3AED] focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleBid(auction.id)}
                              disabled={bid.loading}
                              className="flex-1 rounded-lg bg-[#7C3AED] py-1.5 text-xs font-bold text-white hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
                            >
                              {bid.loading ? 'Pujando...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => toggleBid(auction.id)}
                              className="rounded-lg bg-[#334155] px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleBid(auction.id)}
                          className="mt-auto flex items-center justify-center gap-2 w-full rounded-lg bg-[#7C3AED] py-1.5 text-xs font-bold text-white hover:bg-[#6d28d9] transition-colors"
                        >
                          <Gavel className="h-3 w-3" />
                          Pujar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
