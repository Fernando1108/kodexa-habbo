import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/auth/session-transfer?token=xxx
 *
 * Called when the original user clicks "Sí, fui yo" in the intrusion alert email.
 * - Closes the original session (marks user as offline)
 * - Redirects to login so the user can re-authenticate with a new 2FA token
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    // Find the password reset record used as transfer token
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

    // Mark user as offline to "close" the current session
    await prisma.user.update({
      where: { id: reset.userId },
      data: { online: false, authTicket: '' },
    });

    // Delete the transfer token
    await prisma.passwordReset.delete({ where: { id: reset.id } });

    console.log(`[session-transfer] User ${reset.user.username} confirmed session transfer`);

    // Redirect to login
    return NextResponse.redirect(new URL('/login?message=session_transferred', req.url));
  } catch (err) {
    console.error('[session-transfer]', err);
    return NextResponse.redirect(new URL('/login?error=internal', req.url));
  }
}
