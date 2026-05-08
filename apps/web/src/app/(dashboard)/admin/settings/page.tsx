import { prisma } from '@/lib/db';
import AdminSettingsClient from './AdminSettingsClient';

export const metadata = { title: 'Configuración · Admin Kodexa' };

export default async function AdminSettingsPage() {
  const rawSettings = await prisma.websiteSetting.findMany({ orderBy: { key: 'asc' } });
  const settings = rawSettings.map(s => ({ key: s.key, value: s.value }));
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#F8FAFC]">Configuración del Hotel</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Ajustes generales del CMS y la plataforma</p>
      </div>
      <AdminSettingsClient settings={settings} />
    </div>
  );
}
