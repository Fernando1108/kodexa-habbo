import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Email inválido' }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== Number(session.user.id))
    return NextResponse.json({ error: 'Email ya en uso' }, { status: 409 });

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data:  { email: parsed.data.email },
  });

  return NextResponse.json({ ok: true });
}
