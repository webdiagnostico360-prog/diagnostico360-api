import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { buildPdfHtml } from '../templates/pdfTemplate.js';

export async function generatePdf(submission) {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    const html = buildPdfHtml(submission);

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdfDir = path.resolve('storage/pdfs');
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
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    return {
      ok: true,
      fileName,
      filePath,
      pdfUrl: null,
    };
  } finally {
    await browser.close();
  }
}
