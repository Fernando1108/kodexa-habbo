import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Log siempre para debugging
    console.log(`📧 Enviando email a ${to}: ${subject}`);

    const { data, error } = await resend.emails.send({
      from: `Kodexa Hotel <${FROM}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email enviado:', data?.id);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('❌ Error de Resend:', message);
    // Fallback: log el contenido para que no se pierda
    console.log('📧 FALLBACK — Contenido del email:');
    console.log(`To: ${to} | Subject: ${subject}`);
    console.log(html);
    return { success: false, error: message };
  }
}
