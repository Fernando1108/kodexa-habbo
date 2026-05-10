'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Newspaper, Save, ChevronLeft, AlertCircle, Image, FileText,
  Globe, Archive, File,
} from 'lucide-react';

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface InitialData {
  id:          number;
  title:       string;
  slug:        string;
  excerpt:     string;
  content:     string;
  imageUrl:    string;
  status:      Status;
  publishedAt: string | null;
}

interface Props {
  mode:     'create' | 'edit';
  initial?: InitialData;
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);
}

const STATUS_OPTIONS: { value: Status; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'DRAFT',     label: 'Borrador',  icon: <File className="w-4 h-4" />,    color: '#F59E0B' },
  { value: 'PUBLISHED', label: 'Publicado', icon: <Globe className="w-4 h-4" />,   color: '#10B981' },
  { value: 'ARCHIVED',  label: 'Archivado', icon: <Archive className="w-4 h-4" />, color: '#475569' },
];

export default function NewsForm({ mode, initial }: Props) {
  const router = useRouter();

  const [title,    setTitle]    = useState(initial?.title    ?? '');
  const [slug,     setSlug]     = useState(initial?.slug     ?? '');
  const [excerpt,  setExcerpt]  = useState(initial?.excerpt  ?? '');
  const [content,  setContent]  = useState(initial?.content  ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [status,   setStatus]   = useState<Status>(initial?.status ?? 'DRAFT');

  const [slugManual, setSlugManual] = useState(mode === 'edit' && !!initial?.slug);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  // Auto-generate slug from title in create mode
  useEffect(() => {
    if (mode === 'create' && !slugManual && title) {
      setSlug(toSlug(title));
    }
  }, [title, mode, slugManual]);

  function handleSlugChange(val: string) {
    setSlugManual(true);
    setSlug(toSlug(val));
  }

  async function save(targetStatus?: Status) {
    const resolvedStatus = targetStatus ?? status;

    if (!title.trim()) { setError('El título es requerido.'); return; }
    if (!content.trim()) { setError('El contenido es requerido.'); return; }

    setSaving(true);
    setError('');

    const payload = {
      title:    title.trim(),
      slug:     slug.trim() || undefined,
      excerpt:  excerpt.trim(),
      content:  content.trim(),
      imageUrl: imageUrl.trim(),
      status:   resolvedStatus,
    };

    const url    = mode === 'edit' ? `/api/admin/news/${initial!.id}` : '/api/admin/news';
    const method = mode === 'edit' ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Error al guardar. Intenta de nuevo.');
      return;
    }

    router.push('/admin/news');
    router.refresh();
  }

  const isEdit    = mode === 'edit';
  const pageTitle = isEdit ? 'Editar noticia' : 'Nueva noticia';

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/news" className="icon-btn">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="text-xs uppercase font-mono tracking-[.2em]" style={{ color: '#94A3B8' }}>
            Comunicación
          </div>
          <h1 className="mt-0.5 text-2xl font-bold flex items-center gap-2">
            <Newspaper className="w-5 h-5" style={{ color: '#7C3AED' }} />
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Main form */}
        <div className="space-y-5">
          {/* Title */}
          <div className="card p-5">
            <label className="text-xs uppercase tracking-[.16em] font-mono block mb-2" style={{ color: '#94A3B8' }}>
              Título *
            </label>
            <input
              className="inp w-full text-base font-medium"
              placeholder="Ej: Llega la temporada 2 de Wired Visual"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={128}
            />

            {/* Slug */}
            <label className="text-xs uppercase tracking-[.16em] font-mono block mt-4 mb-2" style={{ color: '#94A3B8' }}>
              Slug URL
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm flex-shrink-0" style={{ color: '#475569' }}>/community/news/</span>
              <input
                className="inp flex-1 font-mono text-sm"
                placeholder="auto-generado-del-titulo"
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                maxLength={200}
              />
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#475569' }}>
              {slugManual ? 'Slug editado manualmente.' : 'Auto-generado desde el título.'}
            </p>
          </div>

          {/* Excerpt */}
          <div className="card p-5">
            <label className="text-xs uppercase tracking-[.16em] font-mono block mb-2" style={{ color: '#94A3B8' }}>
              Extracto <span style={{ color: '#475569' }}>(opcional)</span>
            </label>
            <textarea
              className="inp w-full"
              rows={2}
              placeholder="Resumen corto para la lista de noticias"
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              maxLength={512}
            />
            <p className="text-[11px] mt-1" style={{ color: '#475569' }}>
              {excerpt.length}/512 — Si está vacío, se usa el inicio del contenido.
            </p>
          </div>

          {/* Content */}
          <div className="card p-5">
            <label className="text-xs uppercase tracking-[.16em] font-mono flex items-center gap-2 mb-2" style={{ color: '#94A3B8' }}>
              <FileText className="w-3.5 h-3.5" />
              Contenido *
            </label>
            <textarea
              className="inp w-full font-mono text-sm leading-relaxed"
              rows={16}
              placeholder="Escribe el contenido aquí. Usa líneas en blanco para separar párrafos."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <p className="text-[11px] mt-1" style={{ color: '#475569' }}>
              Texto plano. Los párrafos se separan con doble salto de línea.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div className="card p-5">
            <label className="text-xs uppercase tracking-[.16em] font-mono block mb-3" style={{ color: '#94A3B8' }}>
              Estado
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left cursor-pointer"
                  style={{
                    background:   status === opt.value ? `${opt.color}15` : 'transparent',
                    borderColor:  status === opt.value ? opt.color : '#1E293B',
                    color:        status === opt.value ? opt.color : '#94A3B8',
                  }}
                  onClick={() => setStatus(opt.value)}
                  type="button"
                >
                  {opt.icon}
                  <span className="text-sm font-medium">{opt.label}</span>
                  {status === opt.value && (
                    <span className="ml-auto w-2 h-2 rounded-full" style={{ background: opt.color }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Cover image */}
          <div className="card p-5">
            <label className="text-xs uppercase tracking-[.16em] font-mono flex items-center gap-2 mb-2" style={{ color: '#94A3B8' }}>
              <Image className="w-3.5 h-3.5" />
              Imagen de portada
            </label>
            <input
              className="inp w-full text-sm"
              placeholder="https://…"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div
                className="mt-3 h-28 rounded-lg overflow-hidden"
                style={{ background: `url(${imageUrl}) center/cover`, border: '1px solid #1E293B' }}
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-sm px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#f87171' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="card p-4 space-y-2">
            <button
              className="btn btn-primary w-full justify-center"
              onClick={() => save()}
              disabled={saving || !title.trim() || !content.trim()}
            >
              {saving ? <span className="spinner" /> : <Save className="w-4 h-4" />}
              {status === 'PUBLISHED' ? 'Guardar y publicar' : 'Guardar'}
            </button>
            {status !== 'DRAFT' && (
              <button
                className="btn btn-outline w-full justify-center text-xs"
                onClick={() => save('DRAFT')}
                disabled={saving}
                type="button"
              >
                <File className="w-3.5 h-3.5" />
                Guardar como borrador
              </button>
            )}
            <Link href="/admin/news" className="btn btn-ghost w-full justify-center text-xs">
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
