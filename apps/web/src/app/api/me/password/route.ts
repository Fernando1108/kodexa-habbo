import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  current:  z.string().min(1),
  password: z.string().min(6),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where:  { id: Number(session.user.id) },
    select: { password: true },
  });
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const valid = await bcrypt.compare(parsed.data.current, user.password);
  if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data:  { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
