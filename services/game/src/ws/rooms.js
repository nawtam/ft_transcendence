const rooms = new Map();

function joinRoom(gameId, ws) {
  if (!gameId || !ws) return;

  let sockets = rooms.get(gameId);
  if (!sockets) {
    sockets = new Set();
    rooms.set(gameId, sockets);
  }
  sockets.add(ws);
}

function leaveRoom(gameId, ws) {
  if (!gameId || !ws) return;

  const sockets = rooms.get(gameId);
  if (!sockets) return;

  sockets.delete(ws);
  if (sockets.size === 0) {
    rooms.delete(gameId);
  }
}

function broadcast(gameId, payload) {
  const sockets = rooms.get(gameId);
  if (!sockets || sockets.size === 0) return;

  const message = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === 1) {
      ws.send(message);
    }
  }
}

module.exports = { joinRoom, leaveRoom, broadcast };