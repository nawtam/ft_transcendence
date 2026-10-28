const { createHash } = require('crypto');
const { resetGame, getPlayer, persistSession } = require('./sessionStore');
const { saveGame } = require('../db/gamesRepo');

const games = new Map();

function hashPassword(password) {
  return createHash('sha256').update(String(password)).digest('hex');
}

function persist(game) {
  if (!game) return;
  saveGame(game).catch((err) => console.error('save game', game.gameId, err.message));
}

function hydrateGames(list) {
  games.clear();
  for (const game of list) {
    if (game?.gameId) games.set(game.gameId, game);
  }
}

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
  const id = String(userId);
  if (!lobby.players[id]) {
    lobby.players[id] = {
      id,
      username: username || id,
      ready: false,
      personnageId: null,
      classe: '',
    };
  } else if (username) {
    lobby.players[id].username = username;
  }
  return lobby.players[id];
}

function toLobbyState(game) {
  if (!game) return null;
  const lobby = ensureLobby(game);
  return {
    type: 'lobby_state',
    gameId: game.gameId,
    hostUserId: String(game.hostUserId),
    started: lobby.started,
    messages: lobby.messages || [],
    players: game.playerIds.map((id) => {
      const p = lobby.players[String(id)] || {
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

function ensureCombat(game) {
  if (!game.combat) {
    game.combat = {
      currentTurnUserId: null,
      busy: false,
      turnIndex: 0,
      paByUser: {},
      maxPa: 3,
    };
  }
  return game.combat;
}

function toTurnState(game) {
  const combat = ensureCombat(game);
  return {
    type: 'turn_state',
    gameId: game.gameId,
    currentTurnUserId: combat.currentTurnUserId,
    busy: combat.busy,
    maxPa: combat.maxPa,
    paByUser: { ...combat.paByUser },
  };
}

function initTurns(gameId) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  const combat = ensureCombat(game);
  const ids = game.playerIds.map(String);
  combat.turnIndex = 0;
  combat.busy = false;
  combat.currentTurnUserId = ids[0] || null;
  combat.paByUser = {};
  for (const id of ids) {
    combat.paByUser[id] = combat.maxPa;
  }
  persist(game);
  return { ok: true, state: toTurnState(game) };
}

function canAct(gameId, userId) {
  const game = games.get(gameId);
  if (!game || !game.lobby?.started) {
    return { ok: false, error: 'Game has not started.' };
  }
  const combat = ensureCombat(game);
  if (combat.busy) {
    return { ok: false, error: 'A turn is already being resolved.' };
  }
  if (String(combat.currentTurnUserId) !== String(userId)) {
    return { ok: false, error: 'Not your turn.' };
  }
  const pa = combat.paByUser[String(userId)] ?? 0;
  if (pa <= 0) {
    return { ok: false, error: 'No action points left. End your turn.' };
  }
  return { ok: true, pa, combat, game };
}

function setBusy(gameId, busy) {
  const game = games.get(gameId);
  if (!game) return;
  ensureCombat(game).busy = Boolean(busy);
  persist(game);
}

function spendPa(gameId, userId, cost) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  const combat = ensureCombat(game);
  const id = String(userId);
  const next = (combat.paByUser[id] ?? 0) - Number(cost);
  if (next < 0) return { ok: false, error: 'Not enough action points.' };
  combat.paByUser[id] = next;
  persist(game);
  return { ok: true, pa: next, state: toTurnState(game) };
}

function advanceTurn(gameId) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  const combat = ensureCombat(game);
  const ids = game.playerIds.map(String);
  if (ids.length === 0) return { ok: false, error: 'No players.' };

  combat.turnIndex = (combat.turnIndex + 1) % ids.length;
  combat.currentTurnUserId = ids[combat.turnIndex];
  combat.busy = false;
  for (const id of ids) {
    combat.paByUser[id] = combat.maxPa;
  }
  persist(game);
  return { ok: true, state: toTurnState(game) };
}

function setLobbyReady(gameId, userId, ready) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!game.playerIds.map(String).includes(String(userId))) {
    return { ok: false, error: 'Not a member of this game.' };
  }
  const player = ensureLobbyPlayer(game, userId);
  player.ready = Boolean(ready);
  persist(game);
  return { ok: true, state: toLobbyState(game) };
}

function setLobbyPick(gameId, userId, personnageId, classe) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!game.playerIds.map(String).includes(String(userId))) {
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
  persist(game);
  return { ok: true, state: toLobbyState(game) };
}

function addLobbyChat(gameId, userId, text) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (!game.playerIds.map(String).includes(String(userId))) {
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

  persist(game);
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
  let passwordHash = null;
  if (visibilite === 'prive') {
    const pwd = typeof password === 'string' ? password.trim() : '';
    if (!pwd) {
      return { ok: false, error: 'Password required for private games.' };
    }
    passwordHash = hashPassword(pwd);
  } else {
    visibilite = 'public';
  }

  const gameId = createGameId();
  const meta = {
    gameId,
    mode,
    maxPlayers: mode === 'solo' ? 1 : maxPlayers,
    hostUserId: String(hostUserId),
    visibilite,
    passwordHash,
    titre: typeof titre === 'string' && titre.trim() ? titre.trim() : `Partie ${gameId}`,
    universeId: universeId || null,
    playerIds: [],
    createdAt: new Date().toISOString(),
  };

  games.set(gameId, meta);
  resetGame(gameId);
  meta.playerIds.push(String(hostUserId));
  getPlayer(gameId, String(hostUserId));
  persistSession(gameId, String(hostUserId));
  ensureLobbyPlayer(meta, hostUserId);
  persist(meta);

  return { ok: true, game: meta };
}

function toPublicGame(game) {
  if (!game) return null;
  const { password, passwordHash, lobby, combat, ...safe } = game;
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

  const uid = String(userId);
  if (game.playerIds.map(String).includes(uid)) {
    getPlayer(gameId, uid);
    persistSession(gameId, uid);
    ensureLobbyPlayer(game, uid);
    persist(game);
    return { ok: true, game };
  }

  if (game.playerIds.length >= game.maxPlayers) {
    return { ok: false, error: 'Game is full.' };
  }

  if (game.visibilite === 'prive') {
    const pwd = typeof password === 'string' ? password.trim() : '';
    if (!pwd || hashPassword(pwd) !== game.passwordHash) {
      return { ok: false, error: 'Invalid password.' };
    }
  }

  game.playerIds.push(uid);
  getPlayer(gameId, uid);
  persistSession(gameId, uid);
  ensureLobbyPlayer(game, uid);
  persist(game);

  return { ok: true, game };
}

function isMember(gameId, userId) {
  const game = games.get(gameId);
  if (!game) return false;
  return game.playerIds.map(String).includes(String(userId));
}

function startLobby(gameId, userId) {
  const game = games.get(gameId);
  if (!game) return { ok: false, error: 'Game not found.' };
  if (String(game.hostUserId) !== String(userId)) {
    return { ok: false, error: 'Only the host can start the game.' };
  }

  const lobby = ensureLobby(game);
  if (lobby.started) {
    return {
      ok: true,
      already: true,
      state: toLobbyState(game),
      start: {
        type: 'lobby_start',
        gameId: game.gameId,
        universeId: game.universeId,
        turn: toTurnState(game),
      },
    };
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
  initTurns(gameId);

  return {
    ok: true,
    state: toLobbyState(game),
    start: {
      type: 'lobby_start',
      gameId: game.gameId,
      universeId: game.universeId,
      turn: toTurnState(game),
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
  initTurns,
  canAct,
  setBusy,
  spendPa,
  advanceTurn,
  toTurnState,
  hydrateGames,
  persist,
};