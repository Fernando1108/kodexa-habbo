import { prisma } from '@/lib/db';
import { LandingPage } from '@/components/LandingPage';

export default async function HomePage() {
  const [onlineUsers, totalRooms, totalFurniture, totalUsers, rawNews] = await Promise.all([
    prisma.user.count({ where: { online: true } }),
    prisma.room.count(),
    prisma.itemBase.count(),
    prisma.user.count(),
    prisma.news.findMany({
      where:   { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take:    3,
      select:  { id: true, slug: true, title: true, excerpt: true, imageUrl: true, publishedAt: true, createdAt: true },
    }),
  ]);

  return (
    <LandingPage
      onlineUsers={onlineUsers}
      totalRooms={totalRooms}
      totalFurniture={totalFurniture}
      totalUsers={totalUsers}
      latestNews={rawNews.map(n => ({
        id:       n.id,
        slug:     n.slug ?? null,
        title:    n.title,
        excerpt:  n.excerpt,
        imageUrl: n.imageUrl,
        date:     (n.publishedAt ?? n.createdAt).toISOString(),
      }))}
    />
  );
}
