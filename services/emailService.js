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
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Força IPv4 — Railway usa IPv6 por padrão e a Hostinger não aceita
    family: 4,
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Verifica conexão SMTP
  await transporter.verify();

  // Coleta os 3 destinatários internos
  const internalRecipients = [
    process.env.EMAIL_INTERNAL_1,
    process.env.EMAIL_INTERNAL_2,
    process.env.EMAIL_INTERNAL_3,
  ].filter(Boolean);

  const clientEmail = submission.answers?.email || submission.emailLogin;
  const clientName  = submission.answers?.q1_nome_completo || 'cliente';

  const subjectInternal = `📋 Novo Diagnóstico 360 — ${clientName}`;
  const subjectClient   = 'Recebemos seu formulário — Diagnóstico de Risco Jurídico 360º';

  const internalHtml = `
    <div style="font-family: Arial, sans-serif; color: #1c1c1c; line-height: 1.6; max-width: 600px;">
      <div style="background: #62430B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">📋 Novo Diagnóstico 360 recebido</h2>
      </div>
      <div style="background: #fff; border: 1px solid #E6E6E6; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
        <p><strong>Nome:</strong> ${submission.answers?.q1_nome_completo || '—'}</p>
        <p><strong>Nome empresarial:</strong> ${submission.answers?.q2_nome_empresarial || '—'}</p>
        <p><strong>CPF:</strong> ${submission.answers?.q3_cpf || '—'}</p>
        <p><strong>Telefone:</strong> ${submission.answers?.q5_telefone || '—'}</p>
        <p><strong>E-mail:</strong> ${submission.answers?.email || submission.emailLogin || '—'}</p>
        <p><strong>Cidade/Estado:</strong> ${submission.answers?.q7_cidade_estado || '—'}</p>
        <p><strong>Especialidade:</strong> ${submission.answers?.q12_especialidade || '—'}</p>
        <p><strong>Tipo de atendimento:</strong> ${submission.answers?.q16_tipo_atendimento || '—'}</p>
        <p><strong>Empresa constituída:</strong> ${submission.answers?.q20_empresa_constituida || '—'}</p>
        <p><strong>Natureza da atuação:</strong> ${submission.answers?.q21_natureza_atuacao || '—'}</p>
        <p><strong>Data de envio:</strong> ${submission.submittedAt || '—'}</p>
        <p style="margin-top: 24px; color: #666;">O PDF completo do diagnóstico segue em anexo.</p>
      </div>
    </div>
  `;

  const clientHtml = `
    <div style="font-family: Arial, sans-serif; color: #1c1c1c; line-height: 1.6; max-width: 600px;">
      <div style="background: #62430B; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">✅ Formulário recebido com sucesso</h2>
      </div>
      <div style="background: #fff; border: 1px solid #E6E6E6; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
        <p>Olá, <strong>${clientName}</strong>.</p>
        <p>
          Recebemos corretamente o seu formulário do 
          <strong>Diagnóstico de Risco Jurídico 360º</strong>.
        </p>
        <div style="background: #FFF0D1; border: 1px solid #E2C48D; border-radius: 12px; padding: 20px 24px; margin: 24px 0;">
          <p style="margin: 0; color: #62430B; font-size: 14px;">
            🔍 Nossa equipe irá analisar as informações enviadas e em breve entrará em contato para a entrega do seu diagnóstico personalizado.
          </p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Em caso de dúvidas, entre em contato pelo e-mail 
          <a href="mailto:contato@eizzimelgarejo.com" style="color: #62430B;">contato@eizzimelgarejo.com</a>
        </p>
        <p style="margin-top: 24px;">
          Atenciosamente,<br/>
          <strong style="color: #62430B;">Dra. Eizzi Melgarejo</strong>
        </p>
      </div>
    </div>
  `;

  // Anexo do PDF
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

  // Envia para destinatários internos
  if (internalRecipients.length) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: internalRecipients.join(', '),
      subject: subjectInternal,
      text: formatMainInfo(submission),
      html: internalHtml,
      attachments,
    });
    console.log('E-mail interno enviado para:', internalRecipients.join(', '));
  }

  // Envia confirmação para o cliente
  if (clientEmail) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: clientEmail,
      subject: subjectClient,
      html: clientHtml,
    });
    console.log('E-mail de confirmação enviado para:', clientEmail);
  }

  return {
    ok: true,
    sentToInternal: internalRecipients,
    sentToClient: clientEmail || null,
  };
}
