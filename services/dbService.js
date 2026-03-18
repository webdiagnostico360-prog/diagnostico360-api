import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:skgTEBEwYJloRlTocHWRpEmBuOlFkuFC@maglev.proxy.rlwy.net:57964/railway',
    },
  },
});

export async function salvarDiagnostico(submission) {
  try {
    const { emailLogin, submittedAt, answers, pdf } = submission;

    const pdfBase64 = pdf?.pdfBuffer
      ? Buffer.isBuffer(pdf.pdfBuffer)
        ? pdf.pdfBuffer.toString('base64')
        : pdf.pdfBuffer
      : null;

    const diagnostico = await prisma.diagnostico.create({
      data: {
        emailLogin:         emailLogin?.toLowerCase().trim(),
        submittedAt:        submittedAt ? new Date(submittedAt) : new Date(),
        nomeCompleto:       answers?.q1_nome_completo       || null,
        nomeEmpresarial:    answers?.q2_nome_empresarial    || null,
        cpf:                answers?.q3_cpf                 || null,
        telefone:           answers?.q5_telefone            || null,
        cidadeEstado:       answers?.q7_cidade_estado       || null,
        especialidade:      answers?.q12_especialidade      || null,
        tipoAtendimento:    answers?.q16_tipo_atendimento   || null,
        empresaConstituida: answers?.q20_empresa_constituida || null,
        naturezaAtuacao:    answers?.q21_natureza_atuacao   || null,
        answers:            answers || {},
        pdfNome:            pdf?.fileName  || null,
        pdfBase64:          pdfBase64,
      },
    });

    console.log('[db] salvo:', diagnostico.id);
    return { ok: true, id: diagnostico.id };
  } catch (error) {
    console.error('[db] erro:', error.message);
    return { ok: false, error: error.message };
  }
}

export async function listarDiagnosticos() {
  try {
    const diagnosticos = await prisma.diagnostico.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        emailLogin: true,
        nomeCompleto: true,
        especialidade: true,
        cidadeEstado: true,
        telefone: true,
        cpf: true,
        tipoAtendimento: true,
        empresaConstituida: true,
        submittedAt: true,
        createdAt: true,
        pdfNome: true,
        pdfBase64: true,
      },
    });
    return { ok: true, diagnosticos };
  } catch (error) {
    console.error('[db] erro listar:', error.message);
    return { ok: false, error: error.message };
  }
}

export async function buscarDiagnostico(id) {
  try {
    const diagnostico = await prisma.diagnostico.findUnique({ where: { id } });
    if (!diagnostico) return { ok: false, error: 'Não encontrado' };
    return { ok: true, diagnostico };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
