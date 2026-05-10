import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import MeDashboard from './MeDashboard';

export const metadata = { title: 'Mi Kodexa · Dashboard' };

// Arcturus currency type → label map (kodexa_hotel.users_currency)
// type 0 = duckets/pixels (legacy Arcturus naming — our field is "pixels" on User)
// type 5 = diamonds
// type 101 = points / GOTW
const CURRENCY_LABELS: Record<number, string> = {
  0:   'Duckets',
  5:   'Diamantes',
  101: 'Puntos',
};

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = Number(session.user.id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    user, news, activity, roomCount, dailyRewardLog,
    onlineUsers, onlineCount, popularRooms, featuredUser, latestUser,
    badges, currencies,
  ] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: {
        id: true, username: true, look: true, motto: true,
        rank: true, credits: true, pixels: true,
        createdAt: true, lastLogin: true, online: true,
        userLevel: { select: { level: true, experience: true } },
      },
    }),
    prisma.news.findMany({
      where:   { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take:    4,
      select:  {
        id: true, title: true, slug: true, excerpt: true, content: true,
        imageUrl: true, createdAt: true, publishedAt: true,
        author: { select: { username: true } },
      },
    }),
    prisma.kxActivityLog.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    5,
      select:  { id: true, action: true, details: true, createdAt: true },
    }),
    prisma.room.count({ where: { ownerId: userId } }),
    prisma.kxActivityLog.findFirst({
      where: { userId, action: 'daily_reward', createdAt: { gte: todayStart } },
    }),
    prisma.user.findMany({
      where:   { online: true },
      take:    12,
      orderBy: { lastLogin: 'desc' },
      select:  { username: true, look: true },
    }),
    prisma.user.count({ where: { online: true } }),
    prisma.room.findMany({
      where:   { state: 'open' },
      orderBy: { score: 'desc' },
      take:    5,
      select:  { id: true, name: true, ownerName: true, score: true, category: true },
    }),
    prisma.user.findFirst({
      orderBy: { credits: 'desc' },
      select:  { username: true, look: true, motto: true },
    }),
    prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      select:  { username: true, look: true, createdAt: true },
    }),
    // Badges (users_badges) — last 9 by slot
    prisma.userBadge.findMany({
      where:   { userId },
      orderBy: { slotNumber: 'asc' },
      take:    9,
      select:  { id: true, badgeCode: true, slotNumber: true },
    }),
    // Currencies (users_currency) — type 5 = diamonds, 101 = points
    prisma.userCurrency.findMany({
      where:  { userId },
      select: { type: true, amount: true },
    }),
  ]);

  if (!user) redirect('/login');

  // Map currencies to labelled entries
  const currencyMap = currencies.reduce<Record<string, number>>((acc, c) => {
    const label = CURRENCY_LABELS[c.type];
    if (label) acc[label] = c.amount;
    return acc;
  }, {});

  return (
    <MeDashboard
      user={{
        id:         user.id,
        username:   user.username,
        look:       user.look,
        motto:      user.motto,
        rank:       user.rank,
        credits:    user.credits,
        pixels:     user.pixels,
        createdAt:  user.createdAt.toISOString(),
        lastLogin:  user.lastLogin.toISOString(),
        online:     user.online,
        level:      user.userLevel?.level ?? 1,
        experience: user.userLevel?.experience ?? 0,
      }}
      news={news.map(n => ({
        id:        n.id,
        slug:      n.slug ?? null,
        title:     n.title,
        content:   n.excerpt || n.content,
        imageUrl:  n.imageUrl,
        createdAt: (n.publishedAt ?? n.createdAt).toISOString(),
        author:    n.author.username,
      }))}
      activity={activity.map(a => ({
        id:        a.id,
        action:    a.action,
        details:   a.details ?? '',
        createdAt: a.createdAt.toISOString(),
      }))}
      badges={badges.map(b => ({ id: b.id, badgeCode: b.badgeCode, slotNumber: b.slotNumber }))}
      currencies={currencyMap}
      roomCount={roomCount}
      dailyRewardClaimed={!!dailyRewardLog}
      onlineUsers={onlineUsers}
      onlineCount={onlineCount}
      popularRooms={popularRooms}
      featuredUser={featuredUser
        ? { username: featuredUser.username, look: featuredUser.look, motto: featuredUser.motto }
        : null}
      latestUser={latestUser
        ? { username: latestUser.username, look: latestUser.look, createdAt: latestUser.createdAt.toISOString() }
        : null}
    />
  );
}
