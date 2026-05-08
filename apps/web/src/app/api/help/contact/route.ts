import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // TODO: Send email to soporte@kodexa.io or save to DB
    console.log('[HelpContact]', { name, email, subject, message: message.slice(0, 100) });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[help/contact]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
