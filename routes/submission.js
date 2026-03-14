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

    // Log mínimo — só e-mail e timestamp
    console.log(`[submission] Recebido de: ${emailLogin} em ${new Date().toISOString()}`);

    const formatted = formatSubmission({ emailLogin, submittedAt, answers, questionMap });

    console.log('[submission] Gerando PDF...');
    let pdfResult;
    try {
      pdfResult = await generatePdf(formatted);
      console.log('[submission] PDF gerado:', pdfResult.fileName);
    } catch (pdfError) {
      console.error('[submission] ERRO no PDF:', pdfError.message);
      throw pdfError;
    }

    const submissionWithPdf = { ...formatted, pdf: pdfResult };

    console.log('[submission] Enviando e-mails...');
    let emailResult;
    try {
      emailResult = await sendSubmissionEmail(submissionWithPdf);
      console.log('[submission] E-mails enviados:', JSON.stringify(emailResult));
    } catch (emailError) {
      console.error('[submission] ERRO no e-mail:', emailError.message);
      throw emailError;
    }

    console.log('[submission] Concluído com sucesso!');

    return res.status(200).json({
      ok: true,
      message: 'Submissão recebida com sucesso.',
      submission: { emailLogin: formatted.emailLogin, submittedAt: formatted.submittedAt },
      pdf: { ok: pdfResult.ok, fileName: pdfResult.fileName },
      email: emailResult,
    });
  } catch (error) {
    console.error('[submission] ERRO GERAL:', error.message);
    console.error('[submission] STACK:', error.stack?.split('\n').slice(0, 3).join(' | '));

    return res.status(500).json({
      ok: false,
      message: 'Erro ao processar submissão.',
      error: error.message,
    });
  }
});

export default router;
