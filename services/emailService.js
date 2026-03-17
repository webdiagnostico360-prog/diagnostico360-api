const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function sendSubmissionEmail(submission) {
  console.log('[email] iniciando...');

  const internalRecipients = [
    process.env.EMAIL_INTERNAL_1,
    process.env.EMAIL_INTERNAL_2,
    process.env.EMAIL_INTERNAL_3,
  ].filter(Boolean);

  const clientEmail = submission.answers?.email || submission.emailLogin;
  const clientName = submission.answers?.q1_nome_completo || 'cliente';

  const from = 'Diagnostico 360 <noreplay@send.eizzimelgarejo.com>';

  if (internalRecipients.length) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: internalRecipients,
        subject: `Novo Diagnostico 360 - ${clientName}`,
        html: `<h2>Novo Diagnostico 360</h2><p>Nome: ${clientName}</p><p>Email: ${clientEmail}</p>`,
      }),
    });
    const d = await r.json();
    console.log('[email] interno:', JSON.stringify(d));
  }

  if (clientEmail) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [clientEmail],
        subject: 'Recebemos seu Diagnostico 360',
        html: `<h2>Formulario recebido!</h2><p>Ola ${clientName}, recebemos seu formulario.</p>`,
      }),
    });
    const d = await r.json();
    console.log('[email] cliente:', JSON.stringify(d));
  }

  return { ok: true };
}
