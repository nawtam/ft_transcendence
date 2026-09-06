const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const { onMessage } = require('./ws/onMessage');
const { resetGame, DEFAULT_USER_ID, DEFAULT_GAME_ID } = require('./game/sessionStore');
const { handleTurn } = require('./game/handleTurn');
const { verifyJwtFromUrl } = require('./ws/verifyJwt');

const app = express();
app.use(express.json());

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
    const gameId = req.body.gameId || DEFAULT_GAME_ID;
    const result = await handleTurn(req.body.message || 'Bonjour', userId, gameId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/reset-session', (req, res) => {
  const gameId = req.body?.gameId || DEFAULT_GAME_ID;
  resetGame(gameId);
  res.json({ ok: true, gameId });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  if (process.env.SKIP_JWT !== '1') {
    const auth = verifyJwtFromUrl(req.url || '');
    if (!auth.ok) {
      ws.send(JSON.stringify({ type: 'error', text: auth.error }));
      ws.close(1008, auth.error);
      return;
    }
    ws.user = auth.user;
    ws.gameId = auth.gameId;
  } else {
    ws.gameId = DEFAULT_GAME_ID;
  }

  ws.on('message', (raw) => onMessage(ws, raw));
});

server.listen(3001, () => console.log('game listening on 3001'));