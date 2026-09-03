const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const { onMessage } = require('./ws/onMessage');
const { resetSession, DEFAULT_USER_ID } = require('./game/sessionStore');

const app = express();
app.use(express.json());
const { handleTurn } = require('./game/handleTurn');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.post('/test-turn', async (req, res) => {
  try {
    const userId = req.body.userId || DEFAULT_USER_ID;
    const result = await handleTurn(req.body.message || 'Bonjour', userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/reset-session', (req, res) => {
  const userId = req.body?.userId || DEFAULT_USER_ID;
  resetSession(userId);
  res.json({ ok: true, userId });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const { verifyJwtFromUrl } = require('./ws/verifyJwt');

wss.on('connection', (ws, req) => {
  // Dev only : bypass si SKIP_JWT=1 (tests sans auth)
  if (process.env.SKIP_JWT !== '1') {
    const auth = verifyJwtFromUrl(req.url || '');
    if (!auth.ok) {
      ws.send(JSON.stringify({ type: 'error', text: auth.error }));
      ws.close(1008, auth.error);
      return;
    }
    ws.user = auth.user;
  }

  ws.on('message', (raw) => onMessage(ws, raw));
});

server.listen(3001, () => console.log('game listening on 3001'));