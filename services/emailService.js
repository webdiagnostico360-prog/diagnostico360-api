import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function formatMainInfo(submission) {
  const { emailLogin, answers, submittedAt, pdf } = submission;
  return `
Novo diagnostico recebido

Nome: ${answers.q1_nome_completo || '-'}
Nome empresarial: ${answers.q2_nome_empresarial || '-'}
CPF: ${answers.q3_cpf || '-'}
Telefone: ${answers.q5_telefone || '-'}
E-mail: ${answers.email || emailLogin || '-'}
Cidade/Estado: ${answers.q7_cidade_estado || '-'}
Especialidade: ${answers.q12_especialidade || '-'}
Tipo de atendimento: ${answers.q16_tipo_atendimento || '-'}
Empresa constituida: ${answers.q20_empresa_constituida || '-'}
Natureza da atuacao: ${answers.q21_natureza_atuacao || '-'}
Data de envio: ${submittedAt || '-'}
PDF: ${pdf?.fileName || '-'}
  `.trim();
}

export async function sendSubmissionEmail(submission) {
  const internalRecipients = [
    process.env.EMAIL_INTERNAL_1,
    process.env.EMAIL_INTERNAL_2,
    process.env.EMAIL_INTERNAL_3,
  ].filter(Boolean);

  const clientEmail = submission.answers?.email || submission.emailLogin;
  const clientName  = submission.answers?.q1_nome_completo || 'cliente';

  const fromEmail = 'Diagnostico 360 <noreplay@eizzimelgarejo.com>';

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
        <p><strong>Empresa constituida:</strong> ${submission.answers?.q20_empresa_constituida || '-'}</p>
        <p><strong>Natureza da atuacao:</strong> ${submission.answers?.q21_natureza_atuacao || '-'}</p>
        <p><strong>Data de envio:</strong> ${submission.submittedAt || '-'}</p>
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
        <div style="background: #FFF0D1; border: 1px solid #E2C48D; border-radius: 12px; padding: 20px 24px; margin: 24px 0;">
          <p style="margin: 0; color: #62430B; font-size: 14px;">
            Nossa equipe ira analisar as informacoes enviadas e em breve entrara em contato para a entrega do seu diagnostico personalizado.
          </p>
        </div>
        <p style="margin-top: 24px;">
          Atenciosamente,<br/>
          <strong style="color: #62430B;">Dra. Eizzi Melgarejo</strong>
        </p>
      </div>
    </div>
  `;

  // Monta anexos
  const attachments = [];
  if (submission.pdf?.pdfBuffer) {
    attachments.push({
      filename: submission.pdf.fileName,
      content: submission.pdf.pdfBuffer,
    });
  }

  // Envia para internos
  if (internalRecipients.length) {
    await resend.emails.send({
      from: fromEmail,
      to: internalRecipients,
      subject: `Novo Diagnostico 360 - ${clientName}`,
      html: internalHtml,
      attachments,
    });
    console.log('[email] Interno enviado para:', internalRecipients.join(', '));
  }

  // Envia confirmacao para cliente
  if (clientEmail) {
    await resend.emails.send({
      from: fromEmail,
      to: [clientEmail],
      subject: 'Recebemos seu formulario - Diagnostico de Risco Juridico 360',
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
