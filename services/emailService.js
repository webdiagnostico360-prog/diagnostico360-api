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
  });

  const internalRecipients = [
    process.env.EMAIL_INTERNAL_1,
    process.env.EMAIL_INTERNAL_2,
  ].filter(Boolean);

  const clientEmail = submission.answers?.email || submission.emailLogin;

  const subjectInternal = `Novo Diagnóstico 360 recebido - ${submission.answers?.q1_nome_completo || 'Cliente'}`;
  const subjectClient = 'Recebemos seu formulário - Diagnóstico de Risco Jurídico 360º';

  const internalText = formatMainInfo(submission);

  const internalHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1c1c1c; line-height: 1.6;">
      <h2 style="color: #62430B;">Novo Diagnóstico 360 recebido</h2>

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

      <p style="margin-top: 24px;">
        O PDF completo segue em anexo.
      </p>
    </div>
  `;

  const clientHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1c1c1c; line-height: 1.6;">
      <h2 style="color: #62430B;">Recebemos suas informações com sucesso</h2>

      <p>Olá, ${submission.answers?.q1_nome_completo || 'cliente'}.</p>

      <p>
        Recebemos corretamente o seu formulário do <strong>Diagnóstico de Risco Jurídico 360º</strong>.
      </p>

      <p>
        Nossa equipe agora irá analisar as informações enviadas e, em breve, entrará em contato para a entrega do diagnóstico.
      </p>

      <p>
        Este e-mail confirma o recebimento do seu formulário.
      </p>

      <p style="margin-top: 24px;">
        Atenciosamente,<br/>
        Equipe Dra. Eizzi Melgarejo
      </p>
    </div>
  `;

  const attachments = submission.pdf?.filePath
    ? [
        {
          filename: submission.pdf.fileName,
          path: submission.pdf.filePath,
        },
      ]
    : [];

  if (internalRecipients.length) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: internalRecipients.join(', '),
      subject: subjectInternal,
      text: internalText,
      html: internalHtml,
      attachments,
    });
  }

  if (clientEmail) {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: clientEmail,
      subject: subjectClient,
      html: clientHtml,
      attachments,
    });
  }

  return {
    ok: true,
    sentToInternal: internalRecipients,
    sentToClient: clientEmail || null,
  };
}
