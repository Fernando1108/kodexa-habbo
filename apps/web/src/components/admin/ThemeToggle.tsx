'use client';

import { Sun, Moon } from 'lucide-react';

interface Props {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="icon-btn"
      aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      {theme === 'light'
        ? <Moon className="w-4 h-4" />
        : <Sun  className="w-4 h-4" />}
    </button>
  );
}
