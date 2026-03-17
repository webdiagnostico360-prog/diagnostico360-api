const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function sendSubmissionEmail(submission) {
  console.log('[email] iniciando...');
  console.log('[email] API KEY presente:', !!RESEND_API_KEY);
  console.log('[email] API KEY inicio:', RESEND_API_KEY?.substring(0, 10));

  const internalRecipients = [
    process.env.EMAIL_INTERNAL_1,
    process.env.EMAIL_INTERNAL_2,
    process.env.EMAIL_INTERNAL_3,
  ].filter(Boolean);

  const clientEmail = submission.answers?.email || submission.emailLogin;
  const clientName  = submission.answers?.q1_nome_completo || 'cliente';

  console.log('[email] destinatarios internos:', internalRecipients);
  console.log('[email] cliente:', clientEmail);

  // Testa primeiro sem anexo para isolar problema
  const payloadInterno = {
    from: 'Diagnostico 360 <onboarding@resend.dev>',
    to: internalRecipients,
    subject: `Novo Diagnostico 360 - ${clientName}`,
    html: `
      <h2>Novo Diagnostico 360 recebido</h2>
      <p><strong>Nome:</strong> ${submission.answers?.q1_nome_completo || '-'}</p>
      <p><strong>E-mail:</strong> ${clientEmail || '-'}</p>
      <p><strong>Telefone:</strong> ${submission.answers?.q5_telefone || '-'}</p>
      <p><strong>Especialidade:</strong> ${submission.answers?.q12_especialidade || '-'}</p>
      <p><strong>Data:</strong> ${submission.submittedAt || '-'}</p>
      <p><em>PDF sera enviado em breve.</em></p>
    `,
  };

  console.log('[email] enviando para internos...');

  const responseInterno = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payloadInterno),
  });

  const dataInterno = await responseInterno.json();
  console.log('[email] resposta interno:', JSON.stringify(dataInterno));

  if (!responseInterno.ok) {
    throw new Error(`Resend erro interno: ${JSON.stringify(dataInterno)}`);
  }

  // E-mail para o cliente
  if (clientEmail) {
    const payloadCliente = {
      from: 'Diagnostico 360 <onboarding@resend.dev>',
      to: [clientEmail],
      subject: 'Recebemos seu Diagnostico de Risco Juridico 360',
      html: `
        <h2>Formulario recebido com sucesso!</h2>
        <p>Ola, <strong>${clientName}</strong>.</p>
        <p>Recebemos seu formulario do <strong>Diagnostico de Risco Juridico 360</strong>.</p>
        <p>Nossa equipe entrara em contato em breve com seu diagnostico personalizado.</p>
        <p>Atenciosamente,<br/><strong>Dra. Eizzi Melgarejo</strong></p>
      `,
    };

    const responseCliente = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadCliente),
    });

    const dataCliente = await responseCliente.json();
    console.log('[email] resposta cliente:', JSON.stringify(dataCliente));
  }

  console.log('[email] concluido com sucesso!');
  return { ok: true, sentToInternal: internalRecipients, sentToClient: clientEmail };
}
