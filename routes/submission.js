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
    console.log('[sub] pdf ok:', pdfResult.fileName);
  } catch (e) {
    console.error('[sub] pdf erro:', e.message);
  }

 // Salva no Google Drive
  if (pdfResult?.pdfBuffer) {
    try {
      const driveResult = await uploadPdfToDrive(pdfResult.pdfBuffer, pdfResult.fileName);
      console.log('[sub] drive resultado:', JSON.stringify(driveResult));
    } catch (e) {
      console.error('[sub] drive erro:', e.message);
    }
  } else {
    console.log('[sub] drive: sem pdfBuffer, pulando...');
  }

  // Envia e-mails
  try {
    await sendSubmissionEmail({ ...formatted, pdf: pdfResult });
    console.log('[sub] email ok');
  } catch (e) {
    console.error('[sub] email erro:', e.message);
  }

  return res.status(200).json({
    ok: true,
    message: 'Submissao recebida com sucesso.',
  });
});

export default router;
