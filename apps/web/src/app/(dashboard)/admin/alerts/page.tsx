import { prisma } from '@/lib/db';
import AlertsClient from './AlertsClient';

export const metadata = { title: 'Alertas · Admin Kodexa' };

export default async function AdminAlertsPage() {
  const recentAlerts = await prisma.kxActivityLog.findMany({
    where: { action: 'hotel_alert' },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const alerts = recentAlerts.map(a => ({
    id:       a.id,
    message:  a.details,
    by:       a.user.username,
    sentAt:   a.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#F8FAFC]">Alertas del Hotel</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Envía mensajes masivos a usuarios conectados</p>
      </div>
      <AlertsClient recentAlerts={alerts} />
    </div>
  );
}
