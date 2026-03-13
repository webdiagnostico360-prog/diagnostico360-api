import express from 'express';
import {
  createAccessToken,
  validateAccessToken,
  findAccessByEmail,
  markTokenSent,
} from '../services/accessService.js';

const router = express.Router();

/**
 * POST /api/access/create-token
 * Cria token automático ou manual
 */
router.post('/create-token', async (req, res) => {
  try {
    const { email, source = 'manual', orderId = null } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: 'E-mail é obrigatório.',
      });
    }

    const result = createAccessToken({ email, source, orderId });

    return res.status(200).json({
      ok: true,
      message: 'Token criado com sucesso.',
      access: result,
    });
  } catch (error) {
    console.error('Erro ao criar token:', error);

    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar token.',
      error: error.message,
    });
  }
});

/**
 * GET /api/access/validate?token=...
 */
router.get('/validate', async (req, res) => {
  try {
    const { token } = req.query;

    const result = validateAccessToken(token);

    if (!result.valid) {
      return res.status(400).json({
        ok: false,
        ...result,
      });
    }

    return res.status(200).json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);

    return res.status(500).json({
      ok: false,
      message: 'Erro ao validar token.',
      error: error.message,
    });
  }
});

/**
 * POST /api/access/manual-token
 * Geração manual para equipe / Dra.
 */
router.post('/manual-token', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: 'E-mail é obrigatório.',
      });
    }

    const result = createAccessToken({
      email,
      source: 'manual',
      orderId: null,
    });

    return res.status(200).json({
      ok: true,
      message: 'Token manual criado com sucesso.',
      access: result,
      accessLink: `https://eizzimelgarejo.com/diagnostico360/?token=${result.token}`,
    });
  } catch (error) {
    console.error('Erro ao criar token manual:', error);

    return res.status(500).json({
      ok: false,
      message: 'Erro ao criar token manual.',
      error: error.message,
    });
  }
});

/**
 * POST /api/access/resend-link
 * Prepara reenvio por email
 */
router.post('/resend-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        ok: false,
        message: 'E-mail é obrigatório.',
      });
    }

    const access = findAccessByEmail(email);

    if (!access) {
      return res.status(404).json({
        ok: false,
        message: 'Nenhum acesso ativo encontrado para este e-mail.',
      });
    }

    markTokenSent(email);

    return res.status(200).json({
      ok: true,
      message: 'Reenvio preparado com sucesso.',
      access: {
        email: access.email,
        token: access.token,
        source: access.source,
      },
      accessLink: `https://eizzimelgarejo.com/diagnostico360/?token=${access.token}`,
    });
  } catch (error) {
    console.error('Erro ao preparar reenvio:', error);

    return res.status(500).json({
      ok: false,
      message: 'Erro ao preparar reenvio.',
      error: error.message,
    });
  }
});

export default router;