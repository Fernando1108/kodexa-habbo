export function tokenEmailTemplate(username: string, token: string): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0F172A;border-radius:16px;overflow:hidden;border:1px solid #1E293B;">
      <div style="background:linear-gradient(135deg,#00D4AA 0%,#7C3AED 100%);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;">Kodexa Hotel</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Verificación de seguridad</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#F8FAFC;font-size:16px;margin:0 0 8px;">Hola <strong>${username}</strong>,</p>
        <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Tu código de verificación para iniciar sesión es:
        </p>
        <div style="background:#1E293B;border:2px solid #00D4AA;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
          <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:bold;letter-spacing:8px;color:#00D4AA;">
            ${token}
          </span>
        </div>
        <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:0 0 8px;">
          ⏱️ Este código expira en <strong style="color:#F59E0B;">5 minutos</strong>.
        </p>
        <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:0;">
          Si no solicitaste este código, ignora este mensaje.
        </p>
      </div>
      <div style="background:#1E293B;padding:16px 32px;text-align:center;">
        <p style="color:#475569;font-size:11px;margin:0;">
          © 2025 Kodexa Hotel — Este es un email automático, no responder.
        </p>
      </div>
    </div>
  `;
}

export function intrusionAlertTemplate(
  username: string,
  ip: string,
  time: string,
  confirmUrl: string,
  denyUrl: string
): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0F172A;border-radius:16px;overflow:hidden;border:1px solid #1E293B;">
      <div style="background:linear-gradient(135deg,#EF4444 0%,#F59E0B 100%);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;">⚠️ Alerta de Seguridad</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Kodexa Hotel</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#F8FAFC;font-size:16px;margin:0 0 16px;">
          Hola <strong>${username}</strong>,
        </p>
        <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Alguien intentó iniciar sesión en tu cuenta mientras estabas conectado.
        </p>
        <div style="background:#1E293B;border-radius:10px;padding:16px;margin:0 0 24px;">
          <p style="color:#94A3B8;font-size:13px;margin:0 0 4px;">📍 IP: <strong style="color:#F8FAFC;">${ip}</strong></p>
          <p style="color:#94A3B8;font-size:13px;margin:0;">🕐 Hora: <strong style="color:#F8FAFC;">${time}</strong></p>
        </div>
        <p style="color:#F8FAFC;font-size:15px;font-weight:bold;margin:0 0 16px;">¿Fuiste tú?</p>
        <div style="text-align:center;">
          <a href="${confirmUrl}" style="display:inline-block;background:#00D4AA;color:#062A22;font-weight:bold;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;margin:0 8px 8px 0;">
            ✅ Sí, fui yo
          </a>
          <a href="${denyUrl}" style="display:inline-block;background:#EF4444;color:#fff;font-weight:bold;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;margin:0 0 8px 0;">
            ❌ No fui yo
          </a>
        </div>
        <p style="color:#94A3B8;font-size:12px;margin:16px 0 0;line-height:1.5;">
          Si haces click en "Sí, fui yo", tu sesión actual se cerrará y
          recibirás un nuevo código de verificación.<br>
          Si haces click en "No fui yo", se cerrarán todas las sesiones
          y deberás cambiar tu contraseña.
        </p>
      </div>
      <div style="background:#1E293B;padding:16px 32px;text-align:center;">
        <p style="color:#475569;font-size:11px;margin:0;">
          © 2025 Kodexa Hotel — Alerta automática de seguridad
        </p>
      </div>
    </div>
  `;
}

export function passwordResetForcedTemplate(
  username: string,
  resetUrl: string
): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0F172A;border-radius:16px;overflow:hidden;border:1px solid #1E293B;">
      <div style="background:linear-gradient(135deg,#EF4444 0%,#7C3AED 100%);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;">🔒 Cambio de Contraseña</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Kodexa Hotel</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#F8FAFC;font-size:16px;margin:0 0 16px;">
          Hola <strong>${username}</strong>,
        </p>
        <p style="color:#EF4444;font-size:14px;line-height:1.6;margin:0 0 16px;font-weight:bold;">
          Han intentado ingresar a tu cuenta sin tu autorización.
        </p>
        <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Por seguridad, todas tus sesiones han sido cerradas.
          Debes cambiar tu contraseña para poder volver a iniciar sesión.
        </p>
        <div style="text-align:center;">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(180deg,#14E4BB,#00D4AA);color:#062A22;font-weight:bold;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:15px;">
            Cambiar mi contraseña
          </a>
        </div>
        <p style="color:#94A3B8;font-size:12px;margin:24px 0 0;">
          Este enlace expira en 1 hora.
        </p>
      </div>
      <div style="background:#1E293B;padding:16px 32px;text-align:center;">
        <p style="color:#475569;font-size:11px;margin:0;">
          © 2025 Kodexa Hotel — Alerta de seguridad
        </p>
      </div>
    </div>
  `;
}

export function passwordResetTemplate(
  username: string,
  resetUrl: string
): string {
  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0F172A;border-radius:16px;overflow:hidden;border:1px solid #1E293B;">
      <div style="background:linear-gradient(135deg,#00D4AA 0%,#7C3AED 100%);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;">Kodexa Hotel</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Restablece tu contraseña</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#F8FAFC;font-size:16px;margin:0 0 8px;">Hola <strong>${username}</strong>,</p>
        <p style="color:#94A3B8;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          Haz clic en el botón para crear una nueva contraseña.
        </p>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(180deg,#14E4BB,#00D4AA);color:#062A22;font-weight:bold;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:15px;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:0 0 8px;">
          ⏱️ Este enlace expira en <strong style="color:#F59E0B;">1 hora</strong>.
        </p>
        <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:0;">
          Si no solicitaste este cambio, puedes ignorar este mensaje.
        </p>
      </div>
      <div style="background:#1E293B;padding:16px 32px;text-align:center;">
        <p style="color:#475569;font-size:11px;margin:0;">
          © 2025 Kodexa Hotel — Este es un email automático, no responder.
        </p>
      </div>
    </div>
  `;
}
