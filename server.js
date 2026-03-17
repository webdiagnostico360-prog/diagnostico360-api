import express from 'express';
import cors from 'cors';
import submissionRouter from './routes/submission.js';
import accessRouter from './routes/access.js';

const app = express();
app.get('/debug-env', (req, res) => {
  res.json({
    resend: process.env.RESEND_API_KEY?.substring(0, 10) || 'NAO ENCONTRADO',
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    email1: process.env.EMAIL_INTERNAL_1,
  });
});
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://eizzimelgarejo.com',
      'https://www.eizzimelgarejo.com',
    ],
    methods: ['GET', 'POST'],
    credentials: false,
  })
);

app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API Diagnóstico 360 online' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.get('/setup-db', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    res.json({ ok: true, message: 'Banco criado com sucesso!' });
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});
```

Commit → aguarda Railway → acessa no navegador:
```
https://diagnostico360-api-production.up.railway.app/setup-db

app.get('/debug-env', (req, res) => {
  res.json({
    resend_key_present: !!process.env.RESEND_API_KEY,
    resend_key_start: process.env.RESEND_API_KEY?.substring(0, 15),
    email1: process.env.EMAIL_INTERNAL_1,
    email2: process.env.EMAIL_INTERNAL_2,
    email3: process.env.EMAIL_INTERNAL_3,
  });
});

app.use('/api/submission', submissionRouter);
app.use('/api/access', accessRouter);

app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Erro interno da API:', err);
  res.status(500).json({ ok: false, message: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`API Diagnóstico 360 rodando em http://localhost:${PORT}`);
  console.log('=== VERSAO: ' + new Date().toISOString() + ' ===');
});
