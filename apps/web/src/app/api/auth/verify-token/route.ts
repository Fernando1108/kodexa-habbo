import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, token } = await req.json();

    if (!username || !token) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { username: String(username) },
    });

    if (!user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const staffToken = await prisma.kxStaffToken.findFirst({
      where: {
        userId: user.id,
        token:  String(token).trim(),
        used:   false,
      },
    });

    if (!staffToken) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    if (staffToken.expiresAt < new Date()) {
      await prisma.kxStaffToken.delete({ where: { id: staffToken.id } });
      return NextResponse.json({ error: 'El token ha expirado. Inicia sesión de nuevo.' }, { status: 401 });
    }

    // Mark token as used
    await prisma.kxStaffToken.update({
      where: { id: staffToken.id },
      data: { used: true },
    });

    // Return verified: true so the frontend can call signIn('credentials')
    return NextResponse.json({ verified: true });
  } catch (err) {
    console.error('[verify-token]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
