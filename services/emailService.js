import express from 'express';
import { formatSubmission } from '../utils/formatSubmission.js';
import { generatePdf } from '../services/pdfService.js';
import { sendSubmissionEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { emailLogin, submittedAt, answers, questionMap } = req.body;

    if (!emailLogin) return res.status(400).json({ ok: false, message: 'E-mail obrigatorio.' });
    if (!answers) return res.status(400).json({ ok: false, message: 'Respostas obrigatorias.' });

    console.log('[sub] inicio:', emailLogin);

    const formatted = formatSubmission({ emailLogin, submittedAt, answers, questionMap });

    let pdfResult = null;
    try {
      pdfResult = await generatePdf(formatted);
      console.log('[sub] pdf ok:', pdfResult.fileName);
    } catch (e) {
      console.error('[sub] pdf erro:', e.message);
    }

    console.log('[sub] chamando emailService...');
    console.log('[sub] sendSubmissionEmail tipo:', typeof sendSubmissionEmail);
    
    const emailResult = await sendSubmissionEmail({ ...formatted, pdf: pdfResult });
    console.log('[sub] email resultado:', JSON.stringify(emailResult));

    console.log('[sub] sucesso!');
    return res.status(200).json({ ok: true, message: 'Submissao recebida com sucesso.' });

  } catch (error) {
    console.error('[sub] erro geral:', error.message);
    console.error('[sub] stack:', error.stack);
    return res.status(500).json({ ok: false, message: 'Erro ao processar.', error: error.message });
  }
});

export default router;
