const jwt = require('jsonwebtoken');

function verifyJwtFromUrl(url) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured.');
  }

  const params = new URL(url, 'http://localhost').searchParams;
  const token = params.get('token');
  const gameId = params.get('gameId') || 'solo-dev';

  if (!token) {
    return { ok: false, error: 'Missing token query param.' };
  }

  try {
    const payload = jwt.verify(token, secret);
    return { ok: true, user: payload, gameId };
  } catch {
    return { ok: false, error: 'Invalid or expired token.' };
  }
}

module.exports = { verifyJwtFromUrl };