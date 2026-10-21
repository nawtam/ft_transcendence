const { resetGame, getPlayer } = require('./sessionStore');

const games = new Map();

function createGameId() {
  return `game-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function ensureLobby(game) {
  if (!game.lobby) {
    game.lobby = {
      players: {},
      messages: [],
      started: false,
    };
  }
  return game.lobby;
}

function ensureLobbyPlayer(game, userId, username = null) {
  const lobby = ensureLobby(game);
  if (!lobby.players[userId]) {
    lobby.players[userId] = {
      id: String(userId),
      username: username || String(userId),
      ready: false,
      personnageId: null,
      classe: '',
    };
  } else if (username) {
    lobby.players[userId].username = username;
  }
  return lobby.players[userId];
}

function toLobbyState(game) {
  if (!game) return null;
  const lobby = ensureLobby(game);
  return {
    type: 'lobby_state',
    gameId: game.gameId,
    hostUserId: game.hostUserId,
    started: lobby.started,
    players: game.playerIds.map((id) => {
      const p = lobby.players[id] || {
        id: String(id),
        username: String(id),
        ready: false,
        personnageId: null,
        classe: '',
      };
      return { ...p, id: String(p.id) };
    }),
  };
}

function setLobbyReady(gameId, userId, ready) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!game.playerIds.includes(userId)) {
    return { ok: false, error: 'Not a member of this game.' };
  }
  const player = ensureLobbyPlayer(game, userId);
  player.ready = Boolean(ready);
  return { ok: true, state: toLobbyState(game) };
}

function setLobbyPick(gameId, userId, personnageId, classe) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!game.playerIds.includes(userId)) {
    return { ok: false, error: 'Not a member of this game.' };
  }

  const lobby = ensureLobby(game);
  const pris = Object.values(lobby.players).some(
    (p) => p.id !== String(userId) && p.personnageId === personnageId,
  );
  if (pris) return { ok: false, error: 'Character already taken.' };

  const player = ensureLobbyPlayer(game, userId);
  player.personnageId = personnageId || null;
  player.classe = classe || '';
  return { ok: true, state: toLobbyState(game) };
}

function addLobbyChat(gameId, userId, text) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!game.playerIds.includes(userId)) {
    return { ok: false, error: 'Not a member of this game.' };
  }
  const player = ensureLobbyPlayer(game, userId);
  const message = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: String(userId),
    username: player.username,
    text: String(text).trim(),
  };
  if (!message.text) return { ok: false, error: 'Empty message.' };

  const lobby = ensureLobby(game);
  lobby.messages.push(message);
  if (lobby.messages.length > 50) lobby.messages.shift();

  return { ok: true, message, state: toLobbyState(game) };
}

function createGame({
  mode = 'solo',
  maxPlayers = 1,
  hostUserId = 'dev-user',
  visibilite = 'public',
  password = null,
  titre = null,
  universeId = null,
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
    titre: typeof titre === 'string' && titre.trim() ? titre.trim() : `Partie ${gameId}`,
    universeId: universeId || null,
    playerIds: [],
    createdAt: new Date().toISOString(),
  };

  games.set(gameId, meta);
  resetGame(gameId);
  meta.playerIds.push(hostUserId);
  getPlayer(gameId, hostUserId);
  ensureLobbyPlayer(meta, hostUserId);

  return { ok: true, game: meta };
}

function toPublicGame(game) {
  if (!game) return null;
  const { password, lobby, ...safe } = game;
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
    ensureLobbyPlayer(game, userId);
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
  ensureLobbyPlayer(game, userId);

  return { ok: true, game };
}

function isMember(gameId, userId) {
  const game = games.get(gameId);
  if (!game) return false;
  return game.playerIds.includes(userId);
}

function startLobby(gameId, userId) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (String(game.hostUserId) !== String(userId)) {
    return { ok: false, error: 'Only the host can start the game.' };
  }

  const lobby = ensureLobby(game);
  if (lobby.started) {
    return { ok: true, already: true, state: toLobbyState(game) };
  }

  const minimum = game.mode === 'solo' ? 1 : 2;
  if (game.playerIds.length < minimum) {
    return { ok: false, error: `Need at least ${minimum} players.` };
  }

  const players = game.playerIds.map((id) => ensureLobbyPlayer(game, id));
  if (!players.every((p) => p.ready)) {
    return { ok: false, error: 'All players must be ready.' };
  }

  lobby.started = true;
  return {
    ok: true,
    state: toLobbyState(game),
    start: {
      type: 'lobby_start',
      gameId: game.gameId,
      universeId: game.universeId,
    },
  };
}

module.exports = {
  createGame,
  getGame,
  listGames,
  joinGame,
  toPublicGame,
  isMember,
  ensureLobbyPlayer,
  toLobbyState,
  setLobbyReady,
  setLobbyPick,
  addLobbyChat,
  startLobby,
};