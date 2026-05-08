import { prisma } from '@/lib/db';
import { LandingPage } from '@/components/LandingPage';

export default async function HomePage() {
  const [onlineUsers, totalRooms, totalFurniture, totalUsers] = await Promise.all([
    prisma.user.count({ where: { online: true } }),
    prisma.room.count(),
    prisma.itemBase.count(),
    prisma.user.count(),
  ]);

  return (
    <LandingPage
      onlineUsers={onlineUsers}
      totalRooms={totalRooms}
      totalFurniture={totalFurniture}
      totalUsers={totalUsers}
    />
  );
}
