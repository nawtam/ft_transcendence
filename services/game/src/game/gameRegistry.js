const { resetGame, getPlayer } = require('./sessionStore');

const games = new Map();

function createGameId() {
  return `game-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function createGame({
	mode = 'solo',
	maxPlayers = 1,
	hostUserId = 'dev-user',
	visibilite = 'public',
	password = null,
  } = {}) {
	if (visibilite === 'prive') {
	  const pwd = typeof password === 'string' ? password.trim() : '';
	  if (!pwd) {
		return { ok: false, error: 'Password required for private games.' };
	  }
	  password = pwd;
	} else {
	  visibilite = 'public';
	  password = null;
	}
  
	const gameId = createGameId();
	const meta = {
	  gameId,
	  mode,
	  maxPlayers: mode === 'solo' ? 1 : maxPlayers,
	  hostUserId,
	  visibilite,
	  password,
	  playerIds: [],
	  createdAt: new Date().toISOString(),
	};
  
	games.set(gameId, meta);
	resetGame(gameId);
	meta.playerIds.push(hostUserId);
	getPlayer(gameId, hostUserId);
  
	return { ok: true, game: meta };
}

function toPublicGame(game) {
	if (!game) return null;
	const { password, ...safe } = game;
	return {
	  ...safe,
	  hasPassword: game.visibilite === 'prive',
	};
}

function getGame(gameId) {
  return games.get(gameId) || null;
}

function listGames({ publicOnly = false } = {}) {
	let list = [...games.values()];
	if (publicOnly) list = list.filter((g) => g.visibilite === 'public');
	return list.map(toPublicGame);
}

function joinGame(gameId, userId, password = null) {
	const game = games.get(gameId);
	if (!game) {
	  return { ok: false, error: 'Game not found.' };
	}
	if (!userId) {
	  return { ok: false, error: 'userId is required.' };
	}

	if (game.playerIds.includes(userId)) {
	  getPlayer(gameId, userId);
	  return { ok: true, game };
	}
  
	if (game.playerIds.length >= game.maxPlayers) {
	  return { ok: false, error: 'Game is full.' };
	}

	if (game.visibilite === 'prive') {
	  const pwd = typeof password === 'string' ? password.trim() : '';
	  if (!pwd || pwd !== game.password) {
		return { ok: false, error: 'Invalid password.' };
	  }
	}
  
	game.playerIds.push(userId);
	getPlayer(gameId, userId);
  
	return { ok: true, game };
}

function isMember(gameId, userId) {
	const game = games.get(gameId);
	if (!game) return false;
	return game.playerIds.includes(userId);
}

module.exports = { createGame, getGame, listGames, joinGame, toPublicGame, isMember };