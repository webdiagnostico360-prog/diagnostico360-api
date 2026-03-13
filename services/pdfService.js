import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { buildPdfHtml } from '../templates/pdfTemplate.js';

export async function generatePdf(submission) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    const html = buildPdfHtml(submission);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // No Railway o sistema de arquivos é efêmero — usa /tmp
    const pdfDir = process.env.RAILWAY_ENVIRONMENT
      ? '/tmp/pdfs'
      : path.resolve('storage/pdfs');

    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const safeEmail = submission.emailLogin.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `diagnostico_${safeEmail}_${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, fileName);

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    // Lê o PDF como buffer para enviar por e-mail e Google Drive
    const pdfBuffer = fs.readFileSync(filePath);

    return {
      ok: true,
      fileName,
      filePath,
      pdfBuffer,
      pdfUrl: null,
    };
  } finally {
    await browser.close();
  }
}
