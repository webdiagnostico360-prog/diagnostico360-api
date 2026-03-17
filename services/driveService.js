// services/driveService.js
// Upload de PDFs para o Google Drive via API REST (sem dependências externas)

const DRIVE_FOLDER_ID = '1xvMFAf7Z6NwLmssaW_InUcUTCJ_MENsa';

const SERVICE_ACCOUNT = {
  client_email: 'diagnostico360-drive@avian-insight-490521-f5.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDeGj8cKOk1F7dq\nW/f0RxGoDR+TC2BWwtPUr7+wMIjBzlhbfGFX4s+9HAfWJqRcl/6rDXi4CTbLg2Rz\nSljaD9Us55/fiDTHbSa4xDbfy9n9L1Af/EQeyA2++1vG4Ym9Cv7z8F/TbZ7tBRul\n75ORgRGMP/qwW7SzgatoNoO4eyKurLYl1Cq7nE1Xx9wLyC4pnQZnL6NHfefhys26\nzqYhp9V7pHS8Lnt7+Xm0MIlv8PC/ykpeOs3m76tS5iILuVgxQT9nbdLDDZAREZil\nNIioG5LUZ8QkAjjHrVOvAYCo+DcJdJSx6kQd/9CdwgKTslXMDtaJNccrohlvdvWU\nEctWIHhtAgMBAAECggEABBkdYX5iwTNJE9oTEuuNyJlHZB3xXuB06qd8hLp8h4Dw\nce2zWR0LAr0F6v5nCXtXfF4BBHpNC8fGnnb4eTuSDiRO95+qg6SAsqeSMKJxCQIq\nuxBbTGsaD9RQ/vQx565Qgn1Es2DCLjLqLe9j/GsSgRE8Ja1ngelqWX+qAgkpnGn0\nGqXRcA6JipefUD0FDA0CapUudZ9qSh4HFwNKNuYpgyehcGt4iAJltod8trgNvH/a\nB1gA6yj9XbnyOX5nmPvtHjquRNOu3iEz2nnIdK5ofjWyW6fBYzd/VwTWSo2+fatP\noFQF239QuSN2kP1uD2HhMVy3WpCK9rQGVLgecNaRYQKBgQD4+MLH3ExRh/hWPGUM\nygumY6CZWNHV61B7AFDfWYTKrp86JyE2MYdZxKhIlUbkE97za/UNewc8BBtpDITs\nkwjXiarzBS/+TkTbSmMHxmabPhfw73I0/k4RiMk4dyOlibQb6dtg+aUQHRodCoUk\nJHUh96W+A8lxKqInKNnKS8/CTQKBgQDkX0+ApJIRD3H4edeckZIEYW15pXMxqIEo\n2x5o57TezkKnwa/eJLmh/SUFDsrET7Rlq9JstjwNI27NOiLh+5Nc4Lb3WEJMTz+y\nd6JBboRlzkRF33zLNxxZRjPFR8lx0KnqfRWRypwD4uYX7kPIUe1Pv1zCH48VxbT9\nrrWP5RteoQKBgBhXAXvWfqON3mpX1y0r532pyb6UH1eBfMm5my5qqv/BmJFv1+Bb\ncTcGcck+xsJvauFzUW6y818bq65WafxS149yxwKhJDMBZdvmZs4QyGEu7dpBHnIt\n1mYCcGGTzClX0ALWlvrhDREJN09VgvSol8btVgfAiQYGO/oGFVygkrwVAoGAVPLH\nJfkRhFsUb/MSquDTSeHb0RYkJWKiuMnZI/icpQxgavp3KtDKZGE/tgPslN15IyCo\n41teNxzpCFoJw7nK9Q95v8QK1UvdS8uIhYJQqXXym3Mofob/eo3MkCPF4RpXOixR\nK6wMIL30DQ7KE+e1uKZcILGQje6/BmZIj0AP0EECgYEA7enHh7wURtAgUF8q6Gr5\nDJkczNJlQ0z6hIblwwfpbZ8m8R/CgsDiBKy6fhWEn3HYdJlfjHRMsMhQALkW1Itp\nvd9H1Y4X8TXeOS0yTtcPE1UB/Yjb9C2mF7sKFKY83bBDReCyy9186Nfcyn+wS9Tv\npThEyxkJjI/apldfHOBc9QQ=\n-----END PRIVATE KEY-----\n',
};

// Gera JWT para autenticação com Google
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Importa crypto para assinar
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(SERVICE_ACCOUNT.private_key, 'base64url');
  
  const jwt = `${signingInput}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Auth erro: ${JSON.stringify(data)}`);
  return data.access_token;
}

// Faz upload do PDF para o Google Drive
export async function uploadPdfToDrive(pdfBuffer, fileName) {
  try {
    console.log('[drive] iniciando upload:', fileName);
    
    const accessToken = await getAccessToken();

    // Metadata do arquivo
    const metadata = JSON.stringify({
      name: fileName,
      parents: [DRIVE_FOLDER_ID],
    });

    // Monta o multipart
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`;
    const filePart = `${delimiter}Content-Type: application/pdf\r\nContent-Transfer-Encoding: base64\r\n\r\n${pdfBuffer.toString('base64')}`;
    const body = `${metaPart}${filePart}${closeDelimiter}`;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(`Drive upload erro: ${JSON.stringify(data)}`);
    
    console.log('[drive] upload concluido:', data.id);
    return { ok: true, fileId: data.id, fileName };

  } catch (error) {
    console.error('[drive] erro:', error.message);
    return { ok: false, error: error.message };
  }
}
