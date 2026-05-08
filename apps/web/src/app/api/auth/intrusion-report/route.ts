import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { passwordResetForcedTemplate } from '@/lib/email-templates';

/**
 * GET /api/auth/intrusion-report?token=xxx
 *
 * Called when the original user clicks "No fui yo" in the intrusion alert email.
 * - Closes ALL sessions for this user
 * - Generates a forced password reset token
 * - Sends email with reset link
 * - Redirects to a confirmation page
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    // Find the password reset record used as intrusion token
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset || reset.expiresAt < new Date()) {
      if (reset) {
        await prisma.passwordReset.delete({ where: { id: reset.id } });
      }
      return NextResponse.redirect(new URL('/login?error=token_expired', req.url));
    }

    const user = reset.user;

    // Close all sessions — mark user offline, clear auth ticket
    await prisma.user.update({
      where: { id: user.id },
      data: { online: false, authTicket: '' },
    });

    // Delete all existing password reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Delete all staff tokens for this user
    await prisma.kxStaffToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new password reset token
    const resetToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send forced password reset email
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const recipientEmail = process.env.ADMIN_EMAIL ?? user.email;

    await sendEmail(
      recipientEmail,
      '🔒 Cambia tu contraseña | Kodexa Hotel',
      passwordResetForcedTemplate(
        user.username,
        `${baseUrl}/reset-password/${resetToken}`,
      ),
    );

    console.log(`[intrusion-report] User ${user.username} reported intrusion — all sessions closed, password reset sent`);

    return NextResponse.redirect(new URL('/login?message=intrusion_reported', req.url));
  } catch (err) {
    console.error('[intrusion-report]', err);
    return NextResponse.redirect(new URL('/login?error=internal', req.url));
  }
}
