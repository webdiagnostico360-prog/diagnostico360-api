import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import submissionRouter from './routes/submission.js';
import accessRouter from './routes/access.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://eizzimelgarejo.com',
      'https://www.eizzimelgarejo.com',  // ← adicionar
    ],
    methods: ['GET', 'POST'],
    credentials: false,
  })
);

app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API Diagnóstico 360 online',
  });
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/submission', submissionRouter);
app.use('/api/access', accessRouter);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Rota não encontrada',
  });
});

app.use((err, req, res, next) => {
  console.error('Erro interno da API:', err);

  res.status(500).json({
    ok: false,
    message: 'Erro interno do servidor',
  });
});

app.listen(PORT, () => {
  console.log(`API Diagnóstico 360 rodando em http://localhost:${PORT}`);
  console.log('=== VERSAO: ' + new Date().toISOString() + ' ===');
});
