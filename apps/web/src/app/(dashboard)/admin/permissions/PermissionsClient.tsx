'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface Permission {
  id: number;
  rankName: string;
  level: number;
  badge: string;
  prefix: string;
  prefixColor: string;
  [key: string]: unknown;
}

const CMD_FIELDS = [
  'cmdAlert','cmdBan','cmdKick','cmdMute','cmdUnmute','cmdTeleport',
  'cmdSuperban','cmdIpban','cmdDisconnect','cmdRoomalert','cmdRoomkick',
  'cmdGiveCredits','cmdGivePixels','cmdGivePoints','cmdGiveBadge',
  'cmdChangeName','cmdUpdateHotel','cmdUpdateWordfilter','cmdUpdateNavigator',
  'cmdUpdatePermissions','cmdUpdateCatalog','cmdUpdateTexts','cmdUpdateConfig',
  'cmdEmptyBots','cmdEmptyPets','cmdEnable','cmdRoomItem','cmdSay','cmdShout',
];

const ACC_FIELDS = [
  'accAnyRoomOwner','accAnyroomrights','accFullaccess','accSupporttool',
  'accCatalogadmin','accMoverotate','accTrade','accUnlimitedBots',
  'accUnlimitedPets','accHideOnline','accHideIp','accNotBannable',
  'accAmbassador','accGuide','accHelperTool',
];

function camelToLabel(s: string) {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).replace(/^(Cmd|Acc) /, '');
}

export default function PermissionsClient({ permissions }: { permissions: Permission[] }) {
  const [selected, setSelected] = useState(permissions[0]?.id ?? null);
  const [data, setData] = useState<Record<number, Permission>>(
    Object.fromEntries(permissions.map(p => [p.id, { ...p }]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const perm = selected ? data[selected] : null;

  function toggle(field: string) {
    if (!perm) return;
    setData(prev => ({
      ...prev,
      [perm.id]: { ...prev[perm.id], [field]: prev[perm.id][field] ? 0 : 1 },
    }));
  }

  async function save() {
    if (!perm) return;
    setSaving(true);
    try {
      await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perm),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      {/* Rank list */}
      <div className="card p-2 h-fit">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#475569] px-2 mb-2">Rangos</p>
        <div className="space-y-0.5">
          {permissions.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: selected === p.id ? 'rgba(0,212,170,.1)' : 'transparent',
                color: selected === p.id ? '#00D4AA' : '#94A3B8',
              }}
            >
              <span className="font-mono text-xs mr-2 opacity-60">R{p.level}</span>
              {p.rankName}
            </button>
          ))}
        </div>
      </div>

      {/* Permission editor */}
      {perm && (
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[#F8FAFC]">{perm.rankName}</h2>
                <p className="text-xs text-[#475569]">Nivel {perm.level}</p>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="btn btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: saved ? '#10B981' : undefined }}
              >
                <Save size={12} />{saved ? 'Guardado' : saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {['badge', 'prefix', 'prefixColor'].map(field => (
                <div key={field}>
                  <label className="block text-xs text-[#94A3B8] mb-1">{camelToLabel(field)}</label>
                  <input
                    value={String(perm[field] ?? '')}
                    onChange={e => setData(prev => ({ ...prev, [perm.id]: { ...prev[perm.id], [field]: e.target.value } }))}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-[#F8FAFC] mb-3 text-sm">Comandos</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {CMD_FIELDS.map(field => (
                <label key={field} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={Boolean(perm[field])}
                    onChange={() => toggle(field)}
                    className="w-4 h-4 accent-[#00D4AA] cursor-pointer"
                  />
                  <span className="text-xs text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">
                    {camelToLabel(field)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-[#F8FAFC] mb-3 text-sm">Accesos</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ACC_FIELDS.map(field => (
                <label key={field} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={Boolean(perm[field])}
                    onChange={() => toggle(field)}
                    className="w-4 h-4 accent-[#00D4AA] cursor-pointer"
                  />
                  <span className="text-xs text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">
                    {camelToLabel(field)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
