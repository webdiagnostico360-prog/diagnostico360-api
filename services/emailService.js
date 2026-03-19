const RESEND_API_KEY = 're_JmybzZcN_9newC2yysqoSmB59F5dQuFxo';

export async function sendSubmissionEmail(submission) {
  const internalRecipients = [
    'diagnosticoderisco360@gmail.com',
    'eizzimelgarejoadv@gmail.com',
    'eizzimelgarejo@gmail.com',
  ];

  const clientEmail = submission.answers?.email || submission.emailLogin;
  const clientName  = submission.answers?.q1_nome_completo || 'Cliente';
  const clientPhone = submission.answers?.q5_telefone || '—';
  const clientCity  = submission.answers?.q7_cidade_estado || '—';
  const clientSpec  = submission.answers?.q12_especialidade || '—';
  const clientType  = submission.answers?.q16_tipo_atendimento || '—';
  const clientCo    = submission.answers?.q20_empresa_constituida || '—';
  const submittedAt = new Date(submission.submittedAt || Date.now()).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const from = 'Diagnóstico 360 <noreplay@eizzimelgarejo.com>';

  // Prepara anexo PDF em base64
  const attachments = [];
  if (submission.pdf?.pdfBuffer) {
    attachments.push({
      filename: submission.pdf.fileName || 'diagnostico360.pdf',
      content: Buffer.isBuffer(submission.pdf.pdfBuffer) 
        ? submission.pdf.pdfBuffer.toString('base64')
        : submission.pdf.pdfBuffer,
    });
  }

  const internalHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F6F4F0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#62430B;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <img src="https://eizzimelgarejo.com/wp-content/uploads/2026/03/LOGODIA2.png" alt="Diagnóstico 360" style="height:52px;display:block;margin:0 auto 16px;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">📋 Novo Diagnóstico Recebido</h1>
          <p style="color:#E2C48D;margin:8px 0 0;font-size:14px;">${submittedAt}</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:40px;">
          <p style="color:#4A3208;font-size:16px;margin:0 0 24px;line-height:1.6;">
            Um novo formulário de <strong>Diagnóstico de Risco Jurídico 360º</strong> foi preenchido e está pronto para análise.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border:1px solid #E2C48D;border-radius:12px;padding:24px;margin-bottom:24px;">
            <tr><td>
              <h2 style="color:#62430B;font-size:16px;margin:0 0 20px;padding-bottom:12px;border-bottom:1px solid #E2C48D;">👤 Dados do Cliente</h2>
              <table width="100%" cellpadding="6" cellspacing="0">
                <tr><td style="color:#888;font-size:13px;width:40%;">Nome completo</td><td style="color:#1C1C1C;font-size:14px;font-weight:600;">${clientName}</td></tr>
                <tr><td style="color:#888;font-size:13px;">E-mail</td><td style="color:#1C1C1C;font-size:14px;font-weight:600;">${clientEmail || '—'}</td></tr>
                <tr><td style="color:#888;font-size:13px;">Telefone</td><td style="color:#1C1C1C;font-size:14px;font-weight:600;">${clientPhone}</td></tr>
                <tr><td style="color:#888;font-size:13px;">Cidade/Estado</td><td style="color:#1C1C1C;font-size:14px;font-weight:600;">${clientCity}</td></tr>
                <tr><td style="color:#888;font-size:13px;">Especialidade</td><td style="color:#1C1C1C;font-size:14px;font-weight:600;">${clientSpec}</td></tr>
                <tr><td style="color:#888;font-size:13px;">Tipo de atendimento</td><td style="color:#1C1C1C;font-size:14px;font-weight:600;">${clientType}</td></tr>
                <tr><td style="color:#888;font-size:13px;">Empresa constituída</td><td style="color:#1C1C1C;font-size:14px;font-weight:600;">${clientCo}</td></tr>
              </table>
            </td></tr>
          </table>
          <div style="background:#F0EBE3;border-left:4px solid #62430B;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;color:#62430B;font-size:14px;">
              📎 <strong>O PDF completo com todas as respostas segue em anexo.</strong><br>
              <span style="color:#888;font-size:13px;">Arquivo: ${submission.pdf?.fileName || '—'}</span>
            </p>
          </div>
          <p style="color:#888;font-size:13px;margin:0;line-height:1.6;">
            Para responder ao cliente: <strong>${clientEmail || '—'}</strong>
          </p>
        </td></tr>
        <tr><td style="background:#62430B;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
          <p style="color:#E2C48D;font-size:13px;margin:0;">© ${new Date().getFullYear()} Diagnóstico de Risco Jurídico 360º · Dra. Eizzi Melgarejo</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const clientHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F6F4F0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#62430B;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <img src="https://eizzimelgarejo.com/wp-content/uploads/2026/03/LOGODIA2.png" alt="Diagnóstico 360" style="height:52px;display:block;margin:0 auto 16px;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:600;">✅ Formulário Recebido com Sucesso</h1>
        </td></tr>
        <tr><td style="background:#ffffff;padding:40px;">
          <p style="color:#1C1C1C;font-size:18px;font-weight:600;margin:0 0 8px;">Olá, Dr(a). ${clientName}!</p>
          <p style="color:#6B6B6B;font-size:15px;line-height:1.7;margin:0 0 28px;">
            Recebemos com sucesso o seu <strong style="color:#62430B;">Diagnóstico de Risco Jurídico 360º</strong>. 
            Suas respostas foram registradas e serão analisadas com total atenção e sigilo pela nossa equipe jurídica.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border:1px solid #E2C48D;border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:28px 32px;">
              <h2 style="color:#62430B;font-size:16px;margin:0 0 16px;">O que acontece agora?</h2>
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr>
                  <td style="width:32px;vertical-align:top;font-size:18px;">🔍</td>
                  <td style="color:#4A3208;font-size:14px;line-height:1.6;"><strong>Análise jurídica completa</strong><br>Nossa equipe irá analisar cada resposta identificando vulnerabilidades e riscos jurídicos.</td>
                </tr>
                <tr>
                  <td style="width:32px;vertical-align:top;font-size:18px;">📄</td>
                  <td style="color:#4A3208;font-size:14px;line-height:1.6;"><strong>Diagnóstico personalizado</strong><br>Você receberá um relatório completo e exclusivo com os principais pontos de atenção.</td>
                </tr>
                <tr>
                  <td style="width:32px;vertical-align:top;font-size:18px;">📞</td>
                  <td style="color:#4A3208;font-size:14px;line-height:1.6;"><strong>Retorno da nossa equipe</strong><br>Em breve entraremos em contato para apresentar os resultados e recomendações estratégicas.</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <div style="background:#F6F4F0;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
            <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Dados confirmados</p>
            <p style="margin:0;color:#1C1C1C;font-size:14px;line-height:1.8;">
              <strong>Nome:</strong> ${clientName}<br>
              <strong>E-mail:</strong> ${clientEmail || '—'}<br>
              <strong>Especialidade:</strong> ${clientSpec}<br>
              <strong>Data de envio:</strong> ${submittedAt}
            </p>
          </div>
          <p style="color:#6B6B6B;font-size:14px;line-height:1.7;margin:0;">
            Dúvidas? Entre em contato: <a href="mailto:contato@eizzimelgarejo.com" style="color:#62430B;font-weight:600;">contato@eizzimelgarejo.com</a>
          </p>
        </td></tr>
        <tr><td style="background:#FFF8F0;border-top:1px solid #E2C48D;padding:28px 40px;">
          <p style="margin:0;color:#62430B;font-size:15px;font-weight:700;">Dra. Eizzi Melgarejo</p>
          <p style="margin:4px 0 0;color:#888;font-size:13px;">Advogada Especialista em Direito Médico</p>
          <p style="margin:4px 0 0;color:#888;font-size:13px;">Diagnóstico de Risco Jurídico 360º</p>
        </td></tr>
        <tr><td style="background:#62430B;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="color:#E2C48D;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Diagnóstico de Risco Jurídico 360º · Dra. Eizzi Melgarejo<br>
            <a href="https://eizzimelgarejo.com" style="color:#E2C48D;">eizzimelgarejo.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const results = [];

  // Envia para internos com PDF anexado
  if (internalRecipients.length) {
    const payload = {
      from,
      to: internalRecipients,
      subject: `📋 Novo Diagnóstico 360 — ${clientName}`,
      html: internalHtml,
    };
    if (attachments.length) payload.attachments = attachments;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    results.push({ type: 'internal', status: r.status, response: d });
    if (!r.ok) throw new Error(`Resend interno falhou: ${JSON.stringify(d)}`);
  }

  // Envia confirmação para cliente (sem PDF)
  if (clientEmail) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [clientEmail],
        subject: '✅ Seu Diagnóstico de Risco Jurídico 360º foi recebido',
        html: clientHtml,
      }),
    });
    const d = await r.json();
    results.push({ type: 'client', status: r.status, response: d });
    if (!r.ok) throw new Error(`Resend cliente falhou: ${JSON.stringify(d)}`);
  }

  return { ok: true, results };
}
