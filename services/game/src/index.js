const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { onMessage } = require('./ws/onMessage');
const { resetGame, hydrateSessions, DEFAULT_USER_ID, DEFAULT_GAME_ID } = require('./game/sessionStore');
const { initSessionTables, loadSessions } = require('./db/sessionRepo');
const { handleTurn } = require('./game/handleTurn');
const { verifyJwtFromUrl, verifyJwtFromRequest } = require('./ws/verifyJwt');
const { joinRoom, leaveRoom, broadcast } = require('./ws/rooms');
const {createGame, getGame, listGames, joinGame, toPublicGame, isMember, ensureLobbyPlayer, toLobbyState, hydrateGames, persist} = require('./game/gameRegistry');
const { pool, initGamesTable, loadGames } = require('./db/gamesRepo');

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
	try {
		await pool.query('SELECT 1');
		res.json({ status: 'ok', db: 'connected' });
	} catch (err) {
		res.status(500).json({ status: 'error', error: err.message });
	}
});

app.post('/games', (req, res) => {
	const auth = verifyJwtFromRequest(req);
	if (!auth.ok) {
		return res.status(401).json({ error: auth.error });
	}
	const mode = req.body?.mode || 'solo';
	const maxPlayers = Number(req.body?.maxPlayers) || (mode === 'solo' ? 1 : 4);
	const hostUserId = String(auth.user.sub);
	const visibilite = req.body?.visibilite || 'public';
	const password = req.body?.password ?? null;
	const titre = req.body?.titre ?? null;
	const universeId = req.body?.universeId ?? null;
	const result = createGame({ mode, maxPlayers, hostUserId, visibilite, password, titre, universeId });
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
	const auth = verifyJwtFromRequest(req);
	if (!auth.ok) {
		return res.status(401).json({ error: auth.error });
	}
	const userId = String(auth.user.sub);
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
		const auth = verifyJwtFromUrl(req.url || '', req.headers.cookie || '');
		if (!auth.ok) {
			ws.send(JSON.stringify({ type: 'error', text: auth.error }));
			ws.close(1008, auth.error);
			return;
		}
		ws.user = auth.user;
		ws.gameId = auth.gameId;
	} else {
		const params = new URL(req.url || '', 'http://localhost').searchParams;
		ws.gameId = params.get('gameId') || DEFAULT_GAME_ID;
		ws.user = {
			sub: params.get('userId') || DEFAULT_USER_ID,
			username: params.get('username') || params.get('userId') || DEFAULT_USER_ID,
		};
	}

	const userId = ws.user?.sub || DEFAULT_USER_ID;
	const gameId = ws.gameId;
	const game = getGame(gameId);

	if (game) {
		if (!isMember(gameId, userId)) {
			ws.send(JSON.stringify({ type: 'error', text: 'Not a member of this game.' }));
			ws.close(1008, 'Not a member of this game.');
			return;
		}
		ensureLobbyPlayer(game, userId, ws.user?.username || null);
		persist(game);
	}

	joinRoom(gameId, ws);

	if (game) {
		broadcast(gameId, toLobbyState(game));
	}

	ws.on('message', (raw) => onMessage(ws, raw));

	ws.on('close', () => {
		leaveRoom(gameId, ws);
	});
});

initGamesTable()
  .then(() => initSessionTables())
  .then(() => Promise.all([loadGames(), loadSessions()]))
  .then(([rows, sessions]) => {
    hydrateGames(rows);
    hydrateSessions(sessions);
    server.listen(3001, () => console.log('game listening on 3001'));
  })
  .catch((err) => {
    console.error('game boot failed', err);
    process.exit(1);
  });