import express from 'express';
import { formatSubmission } from '../utils/formatSubmission.js';
import { generatePdf } from '../services/pdfService.js';
import { sendSubmissionEmail } from '../services/emailService.js';
import { uploadPdfToDrive } from '../services/driveService.js';

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

  // Salva no Google Drive
  let driveResult = null;
  if (pdfResult?.pdfBuffer) {
    try {
      driveResult = await uploadPdfToDrive(pdfResult.pdfBuffer, pdfResult.fileName);
    } catch (e) {
      driveResult = { ok: false, error: e.message };
    }
  } else {
    driveResult = { ok: false, error: 'sem pdfBuffer' };
  }

  // Envia e-mails
  let emailResult = null;
  try {
    emailResult = await sendSubmissionEmail({ ...formatted, pdf: pdfResult });
  } catch (e) {
    console.error('[sub] email erro:', e.message);
  }

  return res.status(200).json({
    ok: true,
    message: 'Submissao recebida com sucesso.',
    debug: {
      pdf: pdfResult ? { ok: true, fileName: pdfResult.fileName } : { ok: false },
      drive: driveResult,
      email: emailResult,
    }
  });
});

export default router;
