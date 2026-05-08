import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import MessagesClient from './MessagesClient';

export const metadata = { title: 'Mensajes · Kodexa Hotel' };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ box?: string; thread?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/messages');

  const sp  = await searchParams;
  const box = sp.box === 'sent' ? 'sent' : 'inbox';

  const me = await prisma.user.findUnique({ where: { username: session.user.username } });
  if (!me) redirect('/login');

  const take = 20;

  const where =
    box === 'sent'
      ? { fromId: me.id, parentId: null }
      : { toId: me.id,   parentId: null };

  const [threads, unread] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        from:    { select: { id: true, username: true, look: true } },
        to:      { select: { id: true, username: true, look: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            from: { select: { id: true, username: true } },
            to:   { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    }),
    prisma.message.count({ where: { toId: me.id, read: false } }),
  ]);

  // Open a specific thread if ?thread= param
  const openThreadId = sp.thread ? parseInt(sp.thread) : null;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <MessagesClient
        threads={threads.map(t => ({
          id:        t.id,
          body:      t.body,
          read:      t.read,
          createdAt: t.createdAt.toISOString(),
          from:      { id: t.from.id, username: t.from.username },
          to:        { id: t.to.id,   username: t.to.username   },
          replies:   t.replies.map(r => ({
            id:        r.id,
            body:      r.body,
            read:      r.read,
            createdAt: r.createdAt.toISOString(),
            from:      { id: r.from.id, username: r.from.username },
            to:        { id: r.to.id,   username: r.to.username   },
            replies:   [],
          })),
        }))}
        meId={me.id}
        meUsername={me.username}
        box={box}
        unread={unread}
        openThreadId={openThreadId}
      />
    </main>
  );
}
