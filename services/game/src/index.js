const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');

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
    const result = await handleTurn(req.body.message || 'Bonjour');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { resetSession } = require('./game/sessionStore');

app.post('/reset-session', (req, res) => {
  resetSession();
  res.json({ ok: true });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  ws.on('message', () => ws.send('pong'));
});

server.listen(3001, () => console.log('game listening on 3001'));