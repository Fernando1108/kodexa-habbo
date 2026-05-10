import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { passwordResetTemplate } from '@/lib/email-templates';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Invalidate existing tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send reset email to the user's real address.
    // ADMIN_EMAIL is intentionally NOT used here — it would intercept user resets.
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    const emailResult = await sendEmail(
      user.email,
      'Restablece tu contraseña | Kodexa Hotel',
      passwordResetTemplate(user.username, resetUrl),
    );

    if (!emailResult.success) {
      console.error(`[forgot-password] Failed to send email:`, emailResult.error);
    }

    console.log(`[PasswordReset] user=${user.username} email_sent=${emailResult.success}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

