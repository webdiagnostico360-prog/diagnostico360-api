import express from 'express';
import { formatSubmission } from '../utils/formatSubmission.js';
import { generatePdf } from '../services/pdfService.js';
import { sendSubmissionEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { emailLogin, submittedAt, answers, questionMap } = req.body;

    if (!emailLogin || typeof emailLogin !== 'string') {
      return res.status(400).json({
        ok: false,
        message: 'E-mail do usuário é obrigatório.',
      });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        ok: false,
        message: 'As respostas do formulário são obrigatórias.',
      });
    }

    const formatted = formatSubmission({
      emailLogin,
      submittedAt,
      answers,
      questionMap,
    });

    console.log('=== NOVA SUBMISSÃO RECEBIDA ===');
    console.log(JSON.stringify(formatted, null, 2));

    const pdfResult = await generatePdf(formatted);

    console.log('=== PDF GERADO ===');
    console.log(pdfResult);

    const submissionWithPdf = {
      ...formatted,
      pdf: pdfResult,
    };

    const emailResult = await sendSubmissionEmail(submissionWithPdf);

    console.log('=== E-MAIL ENVIADO ===');
    console.log(emailResult);

    return res.status(200).json({
      ok: true,
      message: 'Submissão recebida com sucesso.',
      submission: formatted,
      pdf: pdfResult,
      email: emailResult,
    });
  } catch (error) {
    console.error('Erro ao processar submissão:', error);

    return res.status(500).json({
      ok: false,
      message: 'Erro ao processar submissão.',
      error: error.message,
    });
  }
});

export default router;