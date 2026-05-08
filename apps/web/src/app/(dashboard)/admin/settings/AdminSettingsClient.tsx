'use client';

import { useState } from 'react';
import { Save, CheckCircle } from 'lucide-react';

interface Setting { key: string; value: string }

const FIELD_DEFS = [
  { key: 'hotel_name',             label: 'Nombre del hotel',          type: 'text',     section: 'General' },
  { key: 'hotel_description',      label: 'Descripción',               type: 'text',     section: 'General' },
  { key: 'hotel_motto',            label: 'Motto del hotel',           type: 'text',     section: 'General' },
  { key: 'default_look',           label: 'Look por defecto',          type: 'text',     section: 'General' },
  { key: 'discord_url',            label: 'URL de Discord',            type: 'url',      section: 'General' },
  { key: 'twitter_url',            label: 'URL de Twitter/X',          type: 'url',      section: 'General' },
  { key: 'max_users',              label: 'Máx. usuarios simultáneos', type: 'number',   section: 'Economía' },
  { key: 'start_credits',          label: 'Créditos iniciales',        type: 'number',   section: 'Economía' },
  { key: 'start_pixels',           label: 'Pixels iniciales',          type: 'number',   section: 'Economía' },
  { key: 'marketplace_commission', label: 'Comisión marketplace (%)',  type: 'number',   section: 'Economía' },
  { key: 'registration_open',      label: 'Registro abierto',          type: 'boolean',  section: 'Control' },
  { key: 'maintenance_mode',       label: 'Modo mantenimiento',        type: 'boolean',  section: 'Control' },
];

const SECTIONS = ['General', 'Economía', 'Control'];

export default function AdminSettingsClient({ settings }: { settings: Setting[] }) {
  const [data, setData] = useState<Record<string, string>>(
    Object.fromEntries(settings.map(s => [s.key, s.value]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  function set(key: string, value: string) {
    setData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { setErr('Error al guardar'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErr('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map(section => {
        const fields = FIELD_DEFS.filter(f => f.section === section);
        return (
          <div key={section} className="card">
            <h2 className="font-semibold text-[#F8FAFC] mb-5 text-sm uppercase tracking-wider font-mono"
                style={{ color: '#00D4AA' }}>
              {section}
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {fields.map(field => {
                const val = data[field.key] ?? '';
                if (field.type === 'boolean') {
                  const isOn = val === 'true';
                  return (
                    <div key={field.key} className="flex items-center justify-between p-4 rounded-xl"
                         style={{ background: '#0F172A', border: '1px solid #1f2b41' }}>
                      <div>
                        <p className="text-sm font-medium text-[#F8FAFC]">{field.label}</p>
                        <p className="text-xs font-mono text-[#334155] mt-0.5">{field.key}</p>
                      </div>
                      <button
                        onClick={() => set(field.key, isOn ? 'false' : 'true')}
                        className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-none"
                        style={{ background: isOn ? '#00D4AA' : '#1E293B', border: `1px solid ${isOn ? '#00D4AA' : '#334155'}` }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                          style={{ transform: isOn ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                      </button>
                    </div>
                  );
                }
                return (
                  <div key={field.key}>
                    <label className="block text-xs text-[#94A3B8] mb-1.5">
                      {field.label}
                      <span className="ml-2 font-mono text-[#334155]">{field.key}</span>
                    </label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={val}
                      onChange={e => set(field.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl sticky bottom-4"
           style={{ background: '#0a1224', border: '1px solid #1f2b41' }}>
        <div>
          {err && <p className="text-xs text-[#EF4444]">{err}</p>}
          {saved && (
            <p className="text-xs text-[#10B981] flex items-center gap-1.5">
              <CheckCircle size={13} /> Configuración guardada
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary py-2.5 px-6 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={14} />{saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
