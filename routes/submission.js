import express from 'express';
import { formatSubmission } from '../utils/formatSubmission.js';
import { generatePdf } from '../services/pdfService.js';
import { sendSubmissionEmail } from '../services/emailService.js';

console.log('=== SUBMISSION ROUTE CARREGADA ===');

const router = express.Router();

router.post('/', async (req, res) => {
  const { emailLogin, submittedAt, answers, questionMap } = req.body;

  if (!emailLogin) return res.status(400).json({ ok: false, message: 'E-mail obrigatorio.' });
  if (!answers) return res.status(400).json({ ok: false, message: 'Respostas obrigatorias.' });

  const formatted = formatSubmission({ emailLogin, submittedAt, answers, questionMap });

  // Gera PDF
  let pdfResult = null;
  try {
    pdfResult = await generatePdf(formatted);
  } catch (e) {
    console.error('[sub] pdf erro:', e.message);
  }

  // Envia e-mails com PDF anexado
  try {
    await sendSubmissionEmail({ ...formatted, pdf: pdfResult });
  } catch (e) {
    console.error('[sub] email erro:', e.message);
  }

  return res.status(200).json({
    ok: true,
    message: 'Submissao recebida com sucesso.',
  });
});

export default router;
