import fs from 'fs';
import path from 'path';

export function buildPdfHtml(submission) {
  const { emailLogin, submittedAt, answers, questionMap = {} } = submission;

  const logoPath = path.resolve('assets/logo.png');
  let logoBase64 = '';

  if (fs.existsSync(logoPath)) {
    const imageBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  const mainData = [
    ['Nome completo', answers.q1_nome_completo],
    ['Nome empresarial', answers.q2_nome_empresarial],
    ['CPF', answers.q3_cpf],
    ['Telefone', answers.q5_telefone],
    ['E-mail', answers.email || emailLogin],
    ['Cidade/Estado', answers.q7_cidade_estado],
    ['Especialidade', answers.q12_especialidade],
    ['Tipo de atendimento', answers.q16_tipo_atendimento],
    ['Volume de pacientes', answers.q18_volume_pacientes],
    ['Empresa constituída', answers.q20_empresa_constituida],
    ['Natureza da atuação', answers.q21_natureza_atuacao],
  ];

  const groupedSections = [
    { title: '1. Identificação', min: 1, max: 22 },
    { title: '2. Estrutura jurídica e organização da atividade', min: 23, max: 32 },
    { title: '3. Equipe, parceiros, colaboradores e relações de trabalho', min: 33, max: 52 },
    { title: '4. Contratos e documentos essenciais', min: 53, max: 63 },
    { title: '5. Consentimento informado', min: 64, max: 74 },
    { title: '6. Prontuário médico e histórico clínico', min: 75, max: 101 },
    { title: '7. Uso de imagem, marketing e Instagram', min: 102, max: 120 },
    { title: '8. LGPD e proteção de dados', min: 121, max: 150 },
    { title: '9. Relação com o paciente e jornada de atendimento', min: 151, max: 167 },
    { title: '10. Espaço físico, estrutura e vigilância sanitária', min: 168, max: 182 },
    { title: '11. Convênios, planos de saúde e glosas', min: 183, max: 193 },
    { title: '12. Processos, denúncias, incidentes e histórico de passivos', min: 194, max: 206 },
    { title: '13. Assessoria jurídica, governança e experiência com advogados', min: 207, max: 215 },
    { title: '14. Avaliação final e autopercepção do cliente', min: 216, max: 224 },
  ];

  function formatValue(value) {
    if (value === undefined || value === null || value === '') return '—';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  function getQuestionLabel(key) {
    return questionMap[key]?.label || key;
  }

  function buildSectionRows(min, max) {
    const rows = [];

    for (let i = min; i <= max; i++) {
      const entry = Object.entries(answers).find(([key]) => key.startsWith(`q${i}_`));
      if (!entry) continue;

      const [key, value] = entry;
      rows.push(`
        <tr>
          <td class="question">${getQuestionLabel(key)}</td>
          <td class="answer">${formatValue(value)}</td>
        </tr>
      `);
    }

    if (!rows.length) {
      return `<tr><td colspan="2" class="empty">Nenhuma resposta encontrada nesta seção.</td></tr>`;
    }

    return rows.join('');
  }

  const mainDataHtml = mainData
    .map(
      ([label, value]) => `
        <div class="summary-item">
          <div class="summary-label">${label}</div>
          <div class="summary-value">${formatValue(value)}</div>
        </div>
      `
    )
    .join('');

  const sectionsHtml = groupedSections
    .map(
      (section) => `
        <section class="section">
          <h2>${section.title}</h2>
          <table>
            <thead>
              <tr>
                <th>Pergunta</th>
                <th>Resposta</th>
              </tr>
            </thead>
            <tbody>
              ${buildSectionRows(section.min, section.max)}
            </tbody>
          </table>
        </section>
      `
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Diagnóstico de Risco Jurídico</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #1c1c1c;
          margin: 0;
          padding: 0;
          background: #ffffff;
        }

        .cover {
          padding: 70px 44px 50px;
          border-bottom: 6px solid #BE964D;
        }

        .logo-wrap {
          margin-bottom: 24px;
        }

        .logo-img {
          max-width: 180px;
          max-height: 70px;
          object-fit: contain;
        }

        .logo-text {
          font-size: 14px;
          font-weight: bold;
          color: #62430B;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .title {
          font-size: 30px;
          font-weight: 700;
          color: #1c1c1c;
          margin-bottom: 10px;
        }

        .subtitle {
          font-size: 16px;
          color: #6B6B6B;
          margin-bottom: 36px;
          line-height: 1.6;
        }

        .meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 30px;
        }

        .meta-box {
          background: #faf7f1;
          border: 1px solid #e2c48d;
          border-radius: 10px;
          padding: 16px;
        }

        .meta-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #765d35;
          margin-bottom: 6px;
          font-weight: 700;
        }

        .meta-value {
          font-size: 15px;
          color: #1c1c1c;
        }

        .summary {
          padding: 28px 44px 8px;
        }

        .summary h2,
        .section h2 {
          font-size: 20px;
          color: #62430B;
          margin-bottom: 18px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .summary-item {
          border: 1px solid #ece5d8;
          border-radius: 10px;
          padding: 12px 14px;
          background: #fffdf9;
        }

        .summary-label {
          font-size: 12px;
          color: #765d35;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 14px;
          color: #1c1c1c;
          line-height: 1.5;
        }

        .section {
          padding: 12px 44px 6px;
          page-break-inside: avoid;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          table-layout: fixed;
        }

        thead th {
          background: #62430B;
          color: #ffffff;
          font-size: 13px;
          text-align: left;
          padding: 12px;
        }

        tbody td {
          border: 1px solid #e7e2d8;
          padding: 10px 12px;
          vertical-align: top;
          font-size: 13px;
          line-height: 1.55;
        }

        td.question {
          width: 42%;
          background: #faf7f1;
          color: #62430B;
          font-weight: 600;
          word-break: break-word;
        }

        td.answer {
          width: 58%;
          color: #1c1c1c;
          word-break: break-word;
        }

        td.empty {
          text-align: center;
          color: #6B6B6B;
          padding: 16px;
        }

        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 11px;
          color: #777;
          padding-bottom: 30px;
        }
      </style>
    </head>
    <body>
      <div class="cover">
        <div class="logo-wrap">
          ${
            logoBase64
              ? `<img src="${logoBase64}" class="logo-img" alt="Logo Diagnóstico 360" />`
              : `<div class="logo-text">Diagnóstico de Risco Jurídico 360º</div>`
          }
        </div>

        <div class="title">Relatório de Respostas do Formulário</div>
        <div class="subtitle">
          Documento gerado automaticamente a partir das respostas enviadas pelo cliente
          para análise jurídica estratégica.
        </div>

        <div class="meta">
          <div class="meta-box">
            <div class="meta-label">E-mail de acesso</div>
            <div class="meta-value">${formatValue(emailLogin)}</div>
          </div>
          <div class="meta-box">
            <div class="meta-label">Data de envio</div>
            <div class="meta-value">${formatValue(submittedAt)}</div>
          </div>
        </div>
      </div>

      <div class="summary">
        <h2>Dados principais</h2>
        <div class="summary-grid">
          ${mainDataHtml}
        </div>
      </div>

      ${sectionsHtml}

      <div class="footer">
        Diagnóstico de Risco Jurídico 360º • Documento gerado automaticamente
      </div>
    </body>
  </html>
  `;
}