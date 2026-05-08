import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({ motto: z.string().max(127) });

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid motto' }, { status: 400 });

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data:  { motto: parsed.data.motto },
  });

  return NextResponse.json({ ok: true });
}
