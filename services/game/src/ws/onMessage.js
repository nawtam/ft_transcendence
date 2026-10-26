const { handleTurn } = require('../game/handleTurn');
const {
  getGame,
  isMember,
  setLobbyReady,
  setLobbyPick,
  addLobbyChat,
  toLobbyState,
  ensureLobbyPlayer,
  startLobby,
  canAct,
  setBusy,
  spendPa,
  advanceTurn,
  toTurnState,
} = require('../game/gameRegistry');
const { broadcast } = require('./rooms');

const PA_COST = {
  examine: 1,
  picked_up: 1,
  used: 1,
  move: 1,
  attack: 2,
};

function safeSend(ws, payload) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
}

function paCostForResult(result) {
  if (!result || result.type === 'clarification') return 0;
  if (result.game_result && result.game_result.success === false) return 0;
  const action = result.intent?.result?.action || result.game_result?.action;
  return PA_COST[action] || 1;
}

async function onMessage(ws, raw) {
  let data;
  try {
    data = JSON.parse(String(raw));
  } catch {
    safeSend(ws, { type: 'error', text: 'Invalid JSON.' });
    return;
  }

  const userId = String(ws.user?.sub || 'dev-user');
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
    if (game.lobby?.started) {
      safeSend(ws, toTurnState(game));
    }
    return;
  }

  if (type === 'turn_sync') {
    const game = getGame(gameId);
    if (!game) {
      safeSend(ws, { type: 'error', text: 'Game not found.' });
      return;
    }
    if (!isMember(gameId, userId)) {
      safeSend(ws, { type: 'error', text: 'Not a member of this game.' });
      return;
    }
    safeSend(ws, toTurnState(game));
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

  if (type === 'lobby_start') {
    const result = startLobby(gameId, userId);
    if (!result.ok) {
      safeSend(ws, { type: 'error', text: result.error });
      return;
    }
    broadcast(gameId, result.state);
    if (result.start) {
      broadcast(gameId, result.start);
      if (result.start.turn) {
        broadcast(gameId, result.start.turn);
      }
    }
    return;
  }

  if (type === 'end_turn') {
    const gate = canAct(gameId, userId);
    const game = getGame(gameId);
    if (!game || !game.lobby?.started) {
      safeSend(ws, { type: 'error', text: 'Game has not started.' });
      return;
    }
    if (!isMember(gameId, userId)) {
      safeSend(ws, { type: 'error', text: 'Not a member of this game.' });
      return;
    }
    const turn = toTurnState(game);
    if (String(turn.currentTurnUserId) !== userId) {
      safeSend(ws, { type: 'error', text: 'Not your turn.' });
      return;
    }
    if (turn.busy) {
      safeSend(ws, { type: 'error', text: 'A turn is already being resolved.' });
      return;
    }
    const advanced = advanceTurn(gameId);
    if (!advanced.ok) {
      safeSend(ws, { type: 'error', text: advanced.error });
      return;
    }
    broadcast(gameId, advanced.state);
    return;
  }

  if (type !== 'action' || typeof data.message !== 'string' || !data.message.trim()) {
    safeSend(ws, {
      type: 'error',
      text: 'Expected lobby_*, turn_sync, end_turn or { type: "action", message: "..." }',
    });
    return;
  }

  const gate = canAct(gameId, userId);
  if (!gate.ok) {
    safeSend(ws, { type: 'error', text: gate.error });
    return;
  }

  const message = data.message.trim();
  setBusy(gameId, true);
  broadcast(gameId, toTurnState(getGame(gameId)));

  try {
    const result = await handleTurn(message, userId, gameId);

    const cost = paCostForResult(result);
    let turnState = toTurnState(getGame(gameId));
    if (cost > 0) {
      const spent = spendPa(gameId, userId, cost);
      if (!spent.ok) {
        safeSend(ws, { type: 'error', text: spent.error });
      } else {
        turnState = spent.state;
        if (spent.pa <= 0) {
          const advanced = advanceTurn(gameId);
          if (advanced.ok) turnState = advanced.state;
        }
      }
    }

    broadcast(gameId, {
      ...result,
      userId,
      message,
      paSpent: cost,
    });
    broadcast(gameId, turnState);
  } catch (err) {
    safeSend(ws, { type: 'error', text: err.message || 'Turn failed.' });
  } finally {
    setBusy(gameId, false);
    const game = getGame(gameId);
    if (game) broadcast(gameId, toTurnState(game));
  }
}

module.exports = { onMessage };