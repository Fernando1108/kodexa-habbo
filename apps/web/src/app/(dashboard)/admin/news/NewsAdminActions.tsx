'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

interface Props {
  newsId:        number;
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
        style={{ color: 'var(--admin-danger)' }}
        onClick={() => setShowModal(true)}
      >
        Eliminar
      </button>

      <ConfirmModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar noticia?"
        description="Esta acción es permanente y no se puede deshacer."
        variant="danger"
        loading={deleting}
        confirmLabel="Eliminar"
      />
    </>
  );
}
