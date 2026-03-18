import express from 'express';
import cors from 'cors';
import submissionRouter from './routes/submission.js';
import accessRouter from './routes/access.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Chave de admin — hardcoded pois process.env não funciona no Railway
const ADMIN_KEY = 'Eizzi360Admin@2026';

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://eizzimelgarejo.com',
      'https://www.eizzimelgarejo.com',
    ],
    methods: ['GET', 'POST', 'DELETE'],
    credentials: false,
  })
);

app.use(express.json({ limit: '10mb' }));

// Middleware de autenticação admin
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ ok: false, message: 'Acesso não autorizado.' });
  }
  next();
}

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API Diagnóstico 360 online' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Rota admin protegida — lista diagnósticos
app.get('/admin/diagnosticos', adminAuth, async (req, res) => {
  try {
    const { listarDiagnosticos } = await import('./services/dbService.js');
    const result = await listarDiagnosticos();
    res.json(result);
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// Rota admin protegida — busca diagnóstico por ID
app.get('/admin/diagnosticos/:id', adminAuth, async (req, res) => {
  try {
    const { buscarDiagnostico } = await import('./services/dbService.js');
    const result = await buscarDiagnostico(req.params.id);
    res.json(result);
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
});

// Rota admin — deletar diagnóstico
app.delete('/admin/diagnosticos/:id', adminAuth, async (req, res) => {
  try {
    const { deletarDiagnostico } = await import('./services/dbService.js');
    const result = await deletarDiagnostico(req.params.id);
    res.json(result);
  } catch (error) {
    res.json({ ok: false, error: error.message });
  }
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
  console.log('API Diagnóstico 360 rodando em http://localhost:' + PORT);
  console.log('=== VERSAO: ' + new Date().toISOString() + ' ===');
});
