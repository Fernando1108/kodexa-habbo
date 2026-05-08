import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
    }

    if (reset.expiresAt < new Date()) {
      await prisma.passwordReset.delete({ where: { token } });
      return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashed },
      }),
      prisma.passwordReset.delete({ where: { token } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reset-password]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
