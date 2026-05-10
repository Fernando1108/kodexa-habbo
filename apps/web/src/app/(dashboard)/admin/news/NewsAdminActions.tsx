'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';

interface Props {
  newsId: number;
  currentStatus: string;
}

export default function NewsAdminActions({ newsId, currentStatus }: Props) {
  const router = useRouter();
  const [deleting,  setDeleting]  = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toggling,  setToggling]  = useState(false);

  async function toggleStatus() {
    setToggling(true);
    const next = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await fetch(`/api/admin/news/${newsId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: next }),
    });
    setToggling(false);
    router.refresh();
  }

  async function confirmDelete() {
    setDeleting(true);
    await fetch(`/api/admin/news/${newsId}`, { method: 'DELETE' });
    setDeleting(false);
    setShowModal(false);
    router.refresh();
  }

  return (
    <>
      <button
        className="btn btn-ghost text-xs"
        onClick={toggleStatus}
        disabled={toggling}
      >
        {toggling
          ? <span className="spinner" />
          : currentStatus === 'PUBLISHED' ? 'Despublicar' : 'Publicar'
        }
      </button>
      <button
        className="btn btn-ghost text-xs"
        style={{ color: '#fca5a5' }}
        onClick={() => setShowModal(true)}
      >
        Eliminar
      </button>

      {showModal && (
        <div
          className="overlay"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal p-6" style={{ maxWidth: 420 }}>
            <div className="flex justify-end mb-2">
              <button className="icon-btn" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)' }}>
              <Trash2 className="w-5 h-5" style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-xl font-bold text-center mt-4">¿Eliminar noticia?</h3>
            <p className="text-sm text-center mt-2" style={{ color: '#94A3B8' }}>
              Esta acción es permanente y no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-2">
              <button className="btn btn-outline flex-1 justify-center" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-danger flex-1 justify-center"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? <span className="spinner" /> : <Trash2 className="w-4 h-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
