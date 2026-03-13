import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const storagePath = path.resolve('storage/access-tokens.json');

function ensureStorageFile() {
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(path.dirname(storagePath), { recursive: true });
    fs.writeFileSync(storagePath, '[]', 'utf-8');
  }
}

function readTokens() {
  ensureStorageFile();
  const raw = fs.readFileSync(storagePath, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeTokens(tokens) {
  fs.writeFileSync(storagePath, JSON.stringify(tokens, null, 2), 'utf-8');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function createAccessToken({ email, source = 'manual', orderId = null }) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error('E-mail é obrigatório para gerar token.');
  }

  const tokens = readTokens();

  const existingIndex = tokens.findIndex(
    (item) => item.email === normalizedEmail && item.status === 'active'
  );

  const token = generateToken();

  const record = {
    email: normalizedEmail,
    token,
    status: 'active',
    source,
    orderId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSentAt: null,
    usedAt: null,        // ← quando o formulário foi concluído
  };

  if (existingIndex >= 0) {
    tokens[existingIndex] = {
      ...tokens[existingIndex],
      token,
      source,
      orderId,
      status: 'active',  // reativa se estava usado
      usedAt: null,
      updatedAt: new Date().toISOString(),
    };
  } else {
    tokens.push(record);
  }

  writeTokens(tokens);

  return {
    email: normalizedEmail,
    token,
    source,
    orderId,
  };
}

export function validateAccessToken(token) {
  if (!token) {
    return { valid: false, reason: 'Token não informado.' };
  }

  const tokens = readTokens();
  const found = tokens.find((item) => item.token === token);

  if (!found) {
    return { valid: false, reason: 'Token inválido ou inativo.' };
  }

  // Token já usado — retorna motivo específico
  if (found.status === 'used') {
    return {
      valid: false,
      reason: 'used',
      email: found.email,
      usedAt: found.usedAt,
    };
  }

  // Token inativo por outro motivo
  if (found.status !== 'active') {
    return { valid: false, reason: 'Token inválido ou inativo.' };
  }

  return {
    valid: true,
    email: found.email,
    source: found.source,
    orderId: found.orderId,
    createdAt: found.createdAt,
  };
}

/**
 * Marca o token como usado após envio do formulário
 */
export function markTokenUsed(token) {
  const tokens = readTokens();

  const index = tokens.findIndex((item) => item.token === token);

  if (index === -1) return null;

  tokens[index].status    = 'used';
  tokens[index].usedAt    = new Date().toISOString();
  tokens[index].updatedAt = new Date().toISOString();

  writeTokens(tokens);

  return tokens[index];
}

export function findAccessByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return null;

  const tokens = readTokens();

  return (
    tokens.find(
      (item) => item.email === normalizedEmail && item.status === 'active'
    ) || null
  );
}

export function markTokenSent(email) {
  const normalizedEmail = normalizeEmail(email);
  const tokens = readTokens();

  const index = tokens.findIndex(
    (item) => item.email === normalizedEmail && item.status === 'active'
  );

  if (index === -1) return null;

  tokens[index].lastSentAt = new Date().toISOString();
  tokens[index].updatedAt  = new Date().toISOString();

  writeTokens(tokens);

  return tokens[index];
}
