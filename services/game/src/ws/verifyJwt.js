const fs = require('fs');
const jwt = require('jsonwebtoken');

const ACCESS_COOKIE = 'access_token';

function loadPublicKey() {
  if (process.env.JWT_PUBLIC_KEY) {
    return process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
  }
  const file = process.env.JWT_PUBLIC_KEY_FILE;
  if (file) {
    return fs.readFileSync(file, 'utf8');
  }
  throw new Error('JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_FILE not configured.');
}

function getCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

function verifyJwtFromUrl(url, cookieHeader = '') {
  const publicKey = loadPublicKey();

  const params = new URL(url, 'http://localhost').searchParams;
  const gameId = params.get('gameId') || 'solo-dev';
  const token = params.get('token') || getCookie(cookieHeader, ACCESS_COOKIE);

  if (!token) {
    return { ok: false, error: 'Missing access token (query or cookie).' };
  }

  try {
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: process.env.JWT_ISSUER || 'auth',
      audience: process.env.JWT_AUDIENCE || 'rpg',
    });

    if (payload.type !== 'access') {
      return { ok: false, error: 'Invalid token type.' };
    }

    return { ok: true, user: payload, gameId };
  } catch {
    return { ok: false, error: 'Invalid or expired token.' };
  }
}

module.exports = { verifyJwtFromUrl };