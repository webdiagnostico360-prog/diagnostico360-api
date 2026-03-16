import express from 'express';
import { formatSubmission } from '../utils/formatSubmission.js';
import { generatePdf } from '../services/pdfService.js';
import { sendSubmissionEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { emailLogin, submittedAt, answers, questionMap } = req.body;

    if (!emailLogin || typeof emailLogin !== 'string') {
      return res.status(400).json({ ok: false, message: 'E-mail do usuário é obrigatório.' });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ ok: false, message: 'As respostas do formulário são obrigatórias.' });
    }

    console.log(`[submission] Recebido de: ${emailLogin}`);

    // STEP 1 — Formata
    const formatted = formatSubmission({ emailLogin, submittedAt, answers, questionMap });

    // STEP 2 — Gera PDF
    let pdfResult = null;
    try {
      pdfResult = await generatePdf(formatted);
      console.log(`[submission] PDF gerado: ${pdfResult.fileName}`);
    } catch (pdfError) {
      console.error('[submission] ERRO PDF:', pdfError.message);
      // PDF falhou mas não bloqueia
    }

    // STEP 3 — Envia e-mail (não bloqueia em caso de erro)
    let emailResult = null;
    let emailError = null;
    try {
      emailResult = await sendSubmissionEmail({ ...formatted, pdf: pdfResult });
      console.log('[submission] E-mail enviado com sucesso');
    } catch (emailErr) {
      emailError = emailErr.message;
      console.error('[submission] ERRO E-MAIL (não bloqueante):', emailErr.message);
    }

    console.log('[submission] Concluído com sucesso!');

    // Retorna sucesso independente do e-mail
    return res.status(200).json({
      ok: true,
      message: 'Submissão recebida com sucesso.',
      pdf: pdfResult ? { ok: true, fileName: pdfResult.fileName } : null,
      email: emailResult,
      emailError,
    });

  } catch (error) {
    console.error('[submission] ERRO GERAL:', error.message);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao processar submissão.',
      error: error.message,
    });
  }
});

export default router;
