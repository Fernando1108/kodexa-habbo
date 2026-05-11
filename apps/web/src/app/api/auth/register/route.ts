import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const schema = z.object({
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Za-z0-9_.]+$/, 'Solo letras, números, _ y .'),
  email:    z.string().email('Email no válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  look:     z.string().max(256).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue.message, field: String(issue.path[0]) }, { status: 400 });
    }

    const { username, email, password, look } = parsed.data;

    // Check duplicates separately for specific error messages
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: 'El username ya está en uso', field: 'username' }, { status: 409 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'El email ya está registrado', field: 'email' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const authTicket     = crypto.randomUUID();

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password:   hashedPassword,
        rank:       1,
        credits:    5000,
        pixels:     10000,
        look:       look ?? 'hr-115-42.hd-195-1.ch-3030-82.lg-275-1408.sh-300-92',
        motto:      'Soy nuevo en Kodexa Hotel',
        authTicket,
        userLevel: {
          create: { level: 1, experience: 0 },
        },
        reputation: {
          create: { score: 0, helpScore: 0, buildScore: 0, socialScore: 0 },
        },
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    console.error('[register]', err);
    // Race condition: two concurrent requests passed both findUnique checks
    // but one won the INSERT. Prisma P2002 = unique constraint violation.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = err.meta?.target as string[] | undefined;
      const field  = target?.includes('email') ? 'email' : 'username';
      const msg    = field === 'email' ? 'El email ya está registrado' : 'El username ya está en uso';
      return NextResponse.json({ error: msg, field }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
