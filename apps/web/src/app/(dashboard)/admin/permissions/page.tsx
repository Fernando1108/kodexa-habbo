import { prisma } from '@/lib/db';
import PermissionsClient from './PermissionsClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Permisos · Admin Kodexa' };

export default async function AdminPermissionsPage() {
  const session = await auth();
  if (!session?.user || session.user.rank < 9) redirect('/admin');

  const permissions = await prisma.permission.findMany({
    orderBy: { level: 'desc' },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#F8FAFC]">Permisos por Rango</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Solo accesible para rango 9 (Propietario)</p>
      </div>
      <PermissionsClient permissions={permissions} />
    </div>
  );
}
