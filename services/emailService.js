import nodemailer from 'nodemailer';

function formatMainInfo(submission) {
  const { emailLogin, answers, submittedAt, pdf } = submission;

  return `
Novo diagnóstico recebido

Nome: ${answers.q1_nome_completo || '—'}
Nome empresarial: ${answers.q2_nome_empresarial || '—'}
CPF: ${answers.q3_cpf || '—'}
Telefone: ${answers.q5_telefone || '—'}
E-mail: ${answers.email || emailLogin || '—'}
Cidade/Estado: ${answers.q7_cidade_estado || '—'}
Especialidade: ${answers.q12_especialidade || '—'}
Tipo de atendimento: ${answers.q16_tipo_atendimento || '—'}
Empresa constituída: ${answers.q20_empresa_constituida || '—'}
Natureza da atuação: ${answers.q21_natureza_atuacao || '—'}

Data de envio: ${submittedAt || '—'}
PDF: ${pdf?.fileName || '—'}
  `.trim();
}

export async function sendSubmissionEmail(submission) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    family: 4,
    tls: {
      rejectUnauthorized: false,
    },
    requireTLS: true,
  });

  await transporter.verify();

  const internalRecipients = [
    process.env.EMAIL_INTERNAL_1,
    process.env.EMAIL_INTERNAL_2,
    process.env.EMAIL_INTERNAL_3,
  ].filter(Boolean);

  const clientEmail = submission.answers?.email || submission.emailLogin;
  const clientName  = submission.answers?.q1_nome_completo || 'cliente';

  const subjectInternal = `Novo Diagnostico 360 - ${clientName}`;
  const subjectClient   = 'Recebemos seu formulario - Diagnostico de Risco Juridico 360';

  const internalHtml = `
    <div style="font-family: Arial, sans-serif; color: #1c1c1c; line-height: 1.6; max-width: 600px;">
      <div style="background: #62430B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">Novo Diagnostico 360 recebido</h2>
      </div>
      <div style="background: #fff; border: 1px solid #E6E6E6; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
        <p><strong>Nome:</strong> ${submission.answers?.q1_nome_completo || '—'}</p>
        <p><strong>E-mail:</strong> ${submission.answers?.email || submission.emailLogin || '—'}</p>
        <p><strong>Telefone:</strong> ${submission.answers?.q5_telefone || '—'}</p>
        <p><strong>Especialidade:</strong> ${submission.answers?.q12_especialidade || '—'}</p>
        <p><strong>Data de envio:</strong> ${submission.submittedAt || '—'}</p>
        <p style="margin-top: 24px; color: #666;">O PDF completo segue em anexo.</p>
      </div>
    </div>
  `;

  const clientHtml = `
    <div style="font-family: Arial, sans-serif; color: #1c1c1c; line-height: 1.6; max-width: 600px;">
      <div style="background: #62430B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">Formulario recebido com sucesso</h2>
      </div>
      <div style="background: #fff; border: 1px solid #E6E6E6; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
        <p>Ola, <strong>${clientName}</strong>.</p>
        <p>Recebemos corretamente o seu formulario do <strong>Diagnostico de Risco Juridico 360</strong>.</p>
        <p style="margin-top: 24px;">Atenciosamente,<br/><strong style="color: #62430B;">Dra. Eizzi Melgarejo</strong></p>
      </div>
    </div>
  `;

  const attachments = [];
  if (submission.pdf?.pdfBuffer) {
    attachments.push({
      filename: submission.pdf.fileName,
      content: submission.pdf.pdfBuffer,
      contentType: 'application/pdf',
    });
  } else if (submission.pdf?.filePath) {
    attachments.push({
      filename: submission.pdf.fileName,
      path: submission.pdf.filePath,
    });
  }

  if (internalRecipients.length) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: internalRecipients.join(', '),
      subject: subjectInternal,
      text: formatMainInfo(submission),
      html: internalHtml,
      attachments,
    });
    console.log('[email] Interno enviado para:', internalRecipients.join(', '));
  }

  if (clientEmail) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: clientEmail,
      subject: subjectClient,
      html: clientHtml,
    });
    console.log('[email] Cliente enviado para:', clientEmail);
  }

  return {
    ok: true,
    sentToInternal: internalRecipients,
    sentToClient: clientEmail || null,
  };
}
