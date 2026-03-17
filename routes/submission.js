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

  // PDF
  let pdfResult = null;
  let pdfError = null;
  try {
    pdfResult = await generatePdf(formatted);
  } catch (e) {
    pdfError = e.message;
  }

  // EMAIL
  let emailResult = null;
  let emailError = null;
  try {
    emailResult = await sendSubmissionEmail({ ...formatted, pdf: pdfResult });
  } catch (e) {
    emailError = e.message;
  }

  // Retorna tudo na resposta para debug
  return res.status(200).json({
    ok: true,
    message: 'Submissao recebida com sucesso.',
    debug: {
      pdf: pdfResult ? { ok: true, fileName: pdfResult.fileName } : { ok: false, error: pdfError },
      email: emailResult || { ok: false, error: emailError },
    }
  });
});

export default router;
