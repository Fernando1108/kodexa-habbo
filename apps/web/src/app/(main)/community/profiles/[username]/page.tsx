import { notFound } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ProfileClient } from './ProfileClient';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return { title: `${username} · Kodexa Hotel` };
}

const userSelect = {
  id: true,
  username: true,
  look: true,
  motto: true,
  rank: true,
  credits: true,
  pixels: true,
  online: true,
  createdAt: true,
  lastLogin: true,
  badges: { orderBy: { slotNumber: 'asc' } },
  ownedRooms: {
    select: {
      id: true,
      name: true,
      description: true,
      score: true,
      state: true,
      maxUsers: true,
    },
    where: { state: { not: 'private' } },
    take: 6,
    orderBy: { score: 'desc' },
  },
  reputation: true,
  userLevel: true,
} satisfies Prisma.UserSelect;

export type ProfileUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: userSelect,
  });

  if (!user) notFound();

  return <ProfileClient user={user} />;
}
