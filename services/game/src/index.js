const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const { onMessage } = require('./ws/onMessage');
const { resetGame, DEFAULT_USER_ID, DEFAULT_GAME_ID } = require('./game/sessionStore');
const { handleTurn } = require('./game/handleTurn');
const { verifyJwtFromUrl } = require('./ws/verifyJwt');
const { createGame, getGame, listGames, joinGame, toPublicGame, isMember } = require('./game/gameRegistry');

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

app.post('/games', (req, res) => {
  const mode = req.body?.mode || 'solo';
  const maxPlayers = Number(req.body?.maxPlayers) || (mode === 'solo' ? 1 : 4);
  const hostUserId = req.body?.hostUserId || DEFAULT_USER_ID;
  const visibilite = req.body?.visibilite || 'public';
  const password = req.body?.password ?? null;

  const result = createGame({ mode, maxPlayers, hostUserId, visibilite, password });
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(toPublicGame(result.game));
});

app.get('/games', (req, res) => {
  res.json({ games: listGames({ publicOnly: true }) });
});

app.get('/games/:gameId', (req, res) => {
	const game = getGame(req.params.gameId);
	if (!game) return res.status(404).json({ error: 'Game not found.' });
	res.json(toPublicGame(game));
});

app.post('/games/:gameId/join', (req, res) => {
  const userId = req.body?.userId || DEFAULT_USER_ID;
  const password = req.body?.password ?? null;
  const result = joinGame(req.params.gameId, userId, password);
  if (!result.ok) {
    const status = result.error === 'Game not found.' ? 404 : 400;
    return res.status(status).json({ error: result.error });
  }
  res.json(toPublicGame(result.game));
});

app.post('/test-turn', async (req, res) => {
  try {
    const userId = req.body.userId || DEFAULT_USER_ID;
    const gameId = req.body.gameId || DEFAULT_GAME_ID;

    const game = getGame(gameId);
    if (game && !isMember(gameId, userId)) {
      return res.status(403).json({ error: 'Not a member of this game.' });
    }

    const result = await handleTurn(req.body.message || 'Hello', userId, gameId);
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
		}else {
			const params = new URL(req.url || '', 'http://localhost').searchParams;
			ws.gameId = params.get('gameId') || DEFAULT_GAME_ID;
			ws.user = { sub: params.get('userId') || DEFAULT_USER_ID };
		}
		ws.user = auth.user;
		ws.gameId = auth.gameId;
	} else {
		ws.gameId = DEFAULT_GAME_ID;
	}

	ws.on('message', (raw) => onMessage(ws, raw));
});

server.listen(3001, () => console.log('game listening on 3001'));