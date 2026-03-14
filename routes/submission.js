import express from 'express';
import { formatSubmission } from '../utils/formatSubmission.js';
import { generatePdf } from '../services/pdfService.js';
import { sendSubmissionEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const log = [];

  try {
    const { emailLogin, submittedAt, answers, questionMap } = req.body;

    if (!emailLogin || typeof emailLogin !== 'string') {
      return res.status(400).json({ ok: false, message: 'E-mail do usuário é obrigatório.' });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ ok: false, message: 'As respostas do formulário são obrigatórias.' });
    }

    log.push(`STEP1:formatSubmission`);
    let formatted;
    try {
      formatted = formatSubmission({ emailLogin, submittedAt, answers, questionMap });
      log.push('STEP1:OK');
    } catch (e) {
      log.push(`STEP1:ERRO:${e.message}`);
      throw e;
    }

    log.push('STEP2:generatePdf');
    let pdfResult;
    try {
      pdfResult = await generatePdf(formatted);
      log.push(`STEP2:OK:${pdfResult.fileName}`);
    } catch (e) {
      log.push(`STEP2:ERRO:${e.message}`);
      throw e;
    }

    log.push('STEP3:sendEmail');
    let emailResult;
    try {
      emailResult = await sendSubmissionEmail({ ...formatted, pdf: pdfResult });
      log.push('STEP3:OK');
    } catch (e) {
      log.push(`STEP3:ERRO:${e.message}`);
      throw e;
    }

    console.log('[OK]', log.join('|'));

    return res.status(200).json({
      ok: true,
      message: 'Submissão recebida com sucesso.',
      pdf: { ok: pdfResult.ok, fileName: pdfResult.fileName },
      email: emailResult,
    });

  } catch (error) {
    console.error('[FALHA]', log.join('|'));
    console.error('[ERRO]', error.message);

    return res.status(500).json({
      ok: false,
      message: 'Erro ao processar submissão.',
      error: error.message,
      steps: log,
    });
  }
});

export default router;
