// Usa fetch nativo do Node 18+ — sem dependência externa!
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Diagnostico 360 <noreplay@eizzimelgarejo.com>';

async function resendSend({ to, subject, html, attachments = [] }) {
  const body = { from: FROM_EMAIL, to, subject, html };
  if (attachments.length > 0) body.attachments = attachments;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Resend erro: ${JSON.stringify(data)}`);
  return data;
}

export async function sendSubmissionEmail(submission) {
  const internalRecipients = [
    process.env.EMAIL_INTERNAL_1,
    process.env.EMAIL_INTERNAL_2,
    process.env.EMAIL_INTERNAL_3,
  ].filter(Boolean);

  const clientEmail = submission.answers?.email || submission.emailLogin;
  const clientName  = submission.answers?.q1_nome_completo || 'cliente';

  const internalHtml = `
    <div style="font-family: Arial, sans-serif; color: #1c1c1c; line-height: 1.6; max-width: 600px;">
      <div style="background: #62430B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">Novo Diagnostico 360 recebido</h2>
      </div>
      <div style="background: #fff; border: 1px solid #E6E6E6; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
        <p><strong>Nome:</strong> ${submission.answers?.q1_nome_completo || '-'}</p>
        <p><strong>E-mail:</strong> ${submission.answers?.email || submission.emailLogin || '-'}</p>
        <p><strong>Telefone:</strong> ${submission.answers?.q5_telefone || '-'}</p>
        <p><strong>CPF:</strong> ${submission.answers?.q3_cpf || '-'}</p>
        <p><strong>Especialidade:</strong> ${submission.answers?.q12_especialidade || '-'}</p>
        <p><strong>Cidade/Estado:</strong> ${submission.answers?.q7_cidade_estado || '-'}</p>
        <p><strong>Data de envio:</strong> ${submission.submittedAt || '-'}</p>
        <p style="color:#666;">O PDF segue em anexo.</p>
      </div>
    </div>`;

  const clientHtml = `
    <div style="font-family: Arial, sans-serif; color: #1c1c1c; line-height: 1.6; max-width: 600px;">
      <div style="background: #62430B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">Formulario recebido com sucesso</h2>
      </div>
      <div style="background: #fff; border: 1px solid #E6E6E6; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
        <p>Ola, <strong>${clientName}</strong>.</p>
        <p>Recebemos seu formulario do <strong>Diagnostico de Risco Juridico 360</strong>.</p>
        <p style="margin-top:24px;">Atenciosamente,<br/><strong style="color:#62430B;">Dra. Eizzi Melgarejo</strong></p>
      </div>
    </div>`;

  // Monta anexos em base64
  const attachments = [];
  if (submission.pdf?.pdfBuffer) {
    attachments.push({
      filename: submission.pdf.fileName,
      content: submission.pdf.pdfBuffer.toString('base64'),
    });
  }

  if (internalRecipients.length) {
    await resendSend({
      to: internalRecipients,
      subject: `Novo Diagnostico 360 - ${clientName}`,
      html: internalHtml,
      attachments,
    });
    console.log('[email] Interno enviado para:', internalRecipients.join(', '));
  }

  if (clientEmail) {
    await resendSend({
      to: [clientEmail],
      subject: 'Recebemos seu formulario - Diagnostico de Risco Juridico 360',
      html: clientHtml,
    });
    console.log('[email] Cliente enviado para:', clientEmail);
  }

  return { ok: true, sentToInternal: internalRecipients, sentToClient: clientEmail || null };
}
