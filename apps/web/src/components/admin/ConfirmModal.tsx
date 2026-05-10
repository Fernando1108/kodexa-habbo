'use client';

import type { ReactNode } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  open:          boolean;
  onClose:       () => void;
  onConfirm:     () => void;
  title:         ReactNode;
  description?:  ReactNode;
  variant?:      'danger' | 'default';
  loading?:      boolean;
  confirmLabel?: string;
  cancelLabel?:  string;
}

export function ConfirmModal({
  open, onClose, onConfirm, title, description,
  variant = 'default', loading = false,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
}: Props) {
  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal p-6" style={{ maxWidth: 420 }}>
        <div
          className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center"
          style={{
            background: isDanger ? 'rgba(239,68,68,.12)'  : 'rgba(0,212,170,.12)',
            border:     isDanger ? '1px solid rgba(239,68,68,.4)' : '1px solid rgba(0,212,170,.4)',
          }}
        >
          {isDanger
            ? <Trash2        className="w-5 h-5" style={{ color: '#EF4444' }} />
            : <AlertTriangle className="w-5 h-5" style={{ color: '#00D4AA' }} />}
        </div>

        <h3 className="text-xl font-bold text-center mt-4" style={{ color: 'var(--admin-text)' }}>
          {title}
        </h3>

        {description && (
          <p className="text-sm text-center mt-2" style={{ color: 'var(--admin-text-muted)' }}>
            {description}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="btn btn-outline flex-1 justify-center"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn flex-1 justify-center ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <div className="spinner" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
