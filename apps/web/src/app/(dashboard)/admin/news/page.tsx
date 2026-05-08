'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Send, File, UserRound, AlertCircle, Newspaper } from 'lucide-react';

interface NewsItem {
  id: number; title: string; content: string;
  imageUrl: string; published: boolean;
  createdAt: string;
  author: { username: string };
}

interface NewsForm {
  title: string; content: string; imageUrl: string; published: boolean;
}

const GRADIENTS = [
  '135deg,#7C3AED,#00D4AA',
  '135deg,#F59E0B,#EF4444',
  '135deg,#5BFFD7,#7C3AED',
  '135deg,#F472B6,#7C3AED',
  '135deg,#3B82F6,#06B6D4',
];

const TAGS = ['#FEATURE', '#ANUNCIO', '#EVENTO', '#COMUNIDAD', '#ACTUALIZACIÓN'];

function rel(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'ahora mismo';
  if (mins  < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

const EMPTY_FORM: NewsForm = { title: '', content: '', imageUrl: '', published: true };

export default function NewsPage() {
  const [news,    setNews]    = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editNews,   setEditNews]   = useState<NewsItem | null>(null);
  const [deleteNews, setDeleteNews] = useState<NewsItem | null>(null);
  const [creating,   setCreating]   = useState(false);
  const [form,       setForm]       = useState<NewsForm>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState('');

  const fetchNews = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/admin/news');
    const data = await res.json();
    setNews(data.news ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditNews(null);
    setErr('');
  }

  function openEdit(n: NewsItem) {
    setForm({ title: n.title, content: n.content, imageUrl: n.imageUrl, published: n.published });
    setEditNews(n);
    setCreating(false);
    setErr('');
  }

  async function save() {
    setSaving(true); setErr('');
    const url    = editNews ? `/api/admin/news/${editNews.id}` : '/api/admin/news';
    const method = editNews ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { setErr('Error al guardar noticia'); return; }
    setCreating(false);
    setEditNews(null);
    fetchNews();
  }

  async function togglePublish(n: NewsItem) {
    await fetch(`/api/admin/news/${n.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !n.published }),
    });
    fetchNews();
  }

  async function confirmDelete() {
    if (!deleteNews) return;
    setSaving(true);
    await fetch(`/api/admin/news/${deleteNews.id}`, { method: 'DELETE' });
    setSaving(false);
    setDeleteNews(null);
    fetchNews();
  }

  const showModal = creating || editNews !== null;

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-xs uppercase font-mono tracking-[.2em]" style={{ color: '#94A3B8' }}>Comunicación</div>
          <h1 className="mt-1 text-3xl font-bold">Noticias del hotel</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus className="w-4 h-4" />Nueva noticia
        </button>
      </div>

      {/* News list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner" />
        </div>
      ) : news.length === 0 ? (
        <div className="card p-12 text-center" style={{ color: '#94A3B8' }}>
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <div className="text-sm">No hay noticias publicadas aún.</div>
          <button className="btn btn-primary mt-4 mx-auto" onClick={openCreate}>
            <Plus className="w-4 h-4" />Crear la primera noticia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {news.map((n, i) => (
            <div key={n.id} className="news-card">
              {/* Thumbnail */}
              <div className="news-thumb" style={{ background: `linear-gradient(${GRADIENTS[i % GRADIENTS.length]})` }}>
                <span className="font-mono text-[11px] tracking-[.18em] px-2 py-0.5 rounded text-white/80" style={{ background: 'rgba(0,0,0,.3)', backdropFilter: 'blur(4px)' }}>
                  {TAGS[i % TAGS.length]}
                </span>
              </div>

              {/* Content */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {n.published
                    ? <span className="badge badge-ok">Publicado</span>
                    : <span className="badge badge-warn">Borrador</span>
                  }
                  <span className="text-[11px] font-mono" style={{ color: '#94A3B8' }}>{rel(n.createdAt)}</span>
                </div>
                <h3 className="mt-2 text-base font-semibold truncate">{n.title}</h3>
                <p className="text-sm mt-0.5 line-clamp-2" style={{ color: '#94A3B8' }}>
                  {n.content.slice(0, 120)}{n.content.length > 120 ? '…' : ''}
                </p>
                <div className="mt-2 text-xs flex items-center gap-2" style={{ color: 'rgba(148,163,184,.8)' }}>
                  <UserRound className="w-3 h-3" /> {n.author.username}
                </div>
              </div>

              {/* Actions */}
              <div className="hidden sm:flex flex-col gap-1.5 items-stretch">
                <button className="btn btn-outline" onClick={() => openEdit(n)}>
                  <Pencil className="w-3.5 h-3.5" />Editar
                </button>
                <button className="btn btn-ghost text-xs" onClick={() => togglePublish(n)}>
                  {n.published ? 'Despublicar' : 'Publicar'}
                </button>
                <button className="btn btn-ghost text-xs" onClick={() => setDeleteNews(n)} style={{ color: '#fca5a5' }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: Create / Edit news ── */}
      {showModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) { setCreating(false); setEditNews(null); } }}>
          <div className="modal p-6" style={{ maxWidth: 640 }}>
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Newspaper className="w-5 h-5" style={{ color: '#7C3AED' }} />
                {creating ? 'Nueva noticia' : 'Editar noticia'}
              </h3>
              <button className="icon-btn" onClick={() => { setCreating(false); setEditNews(null); }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Título</label>
                <input
                  className="inp mt-1.5"
                  placeholder="Ej: Llega la temporada 2 de Wired Visual"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Imagen URL (opcional)</label>
                <input
                  className="inp mt-1.5"
                  placeholder="https://…"
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[.16em] font-mono" style={{ color: '#94A3B8' }}>Contenido</label>
                <textarea
                  className="inp mt-1.5"
                  rows={6}
                  placeholder="Soporta texto plano. Próximamente Markdown."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <span
                  className={`chk${form.published ? ' on' : ''}`}
                  onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                />
                Publicar inmediatamente
              </label>
            </div>
            {err && <div className="mt-3 text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertCircle className="w-3 h-3" />{err}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => { setCreating(false); setEditNews(null); }}>Cancelar</button>
              <button className="btn btn-outline" onClick={() => { setForm(f => ({ ...f, published: false })); save(); }}>
                <File className="w-4 h-4" />Guardar borrador
              </button>
              <button className="btn btn-primary" onClick={save} disabled={saving || !form.title || !form.content}>
                {saving ? <div className="spinner" /> : <Send className="w-4 h-4" />}
                {form.published ? 'Publicar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete confirm ── */}
      {deleteNews !== null && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteNews(null); }}>
          <div className="modal p-6" style={{ maxWidth: 420 }}>
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)' }}>
              <Trash2 className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-xl font-bold text-center mt-4">¿Eliminar noticia?</h3>
            <p className="text-sm text-center mt-2" style={{ color: '#94A3B8' }}>
              Se eliminará permanentemente <b style={{ color: '#F8FAFC' }}>{deleteNews.title}</b>.
            </p>
            <div className="mt-6 flex gap-2">
              <button className="btn btn-outline flex-1 justify-center" onClick={() => setDeleteNews(null)}>Cancelar</button>
              <button className="btn btn-danger flex-1 justify-center" onClick={confirmDelete} disabled={saving}>
                {saving ? <div className="spinner" /> : <Trash2 className="w-4 h-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
