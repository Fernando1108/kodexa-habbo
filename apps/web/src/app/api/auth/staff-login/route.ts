import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { tokenEmailTemplate } from '@/lib/email-templates';

/** Minimum rank that requires 2FA to login */
const STAFF_MIN_RANK = 4;

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Credenciales requeridas' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: String(identifier) },
          { email:    String(identifier) },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    // Non-staff users don't need 2FA
    if (user.rank < STAFF_MIN_RANK) {
      return NextResponse.json({ needs2fa: false });
    }

    // --- Staff 2FA flow ---

    // Generate 6-digit token
    const token = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Get IP from request
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? '0.0.0.0';

    // Invalidate existing tokens for this user
    await prisma.kxStaffToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new token
    await prisma.kxStaffToken.create({
      data: {
        userId: user.id,
        token,
        ip,
        expiresAt,
      },
    });

    // Determine email: use ADMIN_EMAIL for dev, user.email for production
    const recipientEmail = process.env.ADMIN_EMAIL ?? user.email;

    // Send email with token
    const emailResult = await sendEmail(
      recipientEmail,
      `${token} — Tu código de verificación | Kodexa Hotel`,
      tokenEmailTemplate(user.username, token),
    );

    if (!emailResult.success) {
      console.error(`[staff-login] Failed to send email to ${recipientEmail}:`, emailResult.error);
      // Don't block login if email fails — token is in logs
    }

    return NextResponse.json({
      needs2fa:  true,
      username:  user.username,
      emailHint: recipientEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (err) {
    console.error('[staff-login]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
