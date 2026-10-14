const { handleTurn } = require('../game/handleTurn');
const { getGame, isMember } = require('../game/gameRegistry');
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

  if (data.type !== 'action' || typeof data.message !== 'string' || !data.message.trim()) {
    safeSend(ws, {
      type: 'error',
      text: 'Expected { type: "action", message: "..." }',
    });
    return;
  }

  try {
    const userId = ws.user?.sub || 'dev-user';
    const gameId = ws.gameId || 'solo-dev';
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