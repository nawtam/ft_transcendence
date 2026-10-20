const { handleTurn } = require('../game/handleTurn');
const {
  getGame,
  isMember,
  setLobbyReady,
  setLobbyPick,
  addLobbyChat,
  toLobbyState,
  ensureLobbyPlayer,
} = require('../game/gameRegistry');
const { broadcast } = require('./rooms');

function safeSend(ws, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

async function onMessage(ws, raw) {
  let data;
  try {
    data = JSON.parse(String(raw));
  } catch {
    safeSend(ws, { type: 'error', text: 'Invalid JSON.' });
    return;
  }

  const userId = ws.user?.sub || 'dev-user';
  const gameId = ws.gameId || 'solo-dev';
  const type = data.type;

  if (type === 'lobby_sync') {
    const game = getGame(gameId);
    if (!game) {
      safeSend(ws, { type: 'error', text: 'Game not found.' });
      return;
    }
    if (!isMember(gameId, userId)) {
      safeSend(ws, { type: 'error', text: 'Not a member of this game.' });
      return;
    }
    ensureLobbyPlayer(game, userId, ws.user?.username || null);
    safeSend(ws, toLobbyState(game));
    return;
  }

  if (type === 'lobby_ready') {
    const result = setLobbyReady(gameId, userId, data.ready);
    if (!result.ok) {
      safeSend(ws, { type: 'error', text: result.error });
      return;
    }
    broadcast(gameId, result.state);
    return;
  }

  if (type === 'lobby_pick') {
    const result = setLobbyPick(gameId, userId, data.personnageId, data.classe);
    if (!result.ok) {
      safeSend(ws, { type: 'error', text: result.error });
      return;
    }
    broadcast(gameId, result.state);
    return;
  }

  if (type === 'lobby_chat') {
    const result = addLobbyChat(gameId, userId, data.text);
    if (!result.ok) {
      safeSend(ws, { type: 'error', text: result.error });
      return;
    }
    broadcast(gameId, {
      type: 'lobby_chat',
      ...result.message,
    });
    return;
  }

  if (type !== 'action' || typeof data.message !== 'string' || !data.message.trim()) {
    safeSend(ws, {
      type: 'error',
      text: 'Expected lobby_* or { type: "action", message: "..." }',
    });
    return;
  }

  try {
    const message = data.message.trim();
    const game = getGame(gameId);
    if (game && !isMember(gameId, userId)) {
      safeSend(ws, { type: 'error', text: 'Not a member of this game.' });
      return;
    }

    const result = await handleTurn(message, userId, gameId);
    broadcast(gameId, {
      ...result,
      userId,
      message,
    });
  } catch (err) {
    safeSend(ws, { type: 'error', text: err.message || 'Turn failed.' });
  }
}

module.exports = { onMessage };