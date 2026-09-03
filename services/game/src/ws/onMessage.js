const { handleTurn } = require('../game/handleTurn');

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
    const result = await handleTurn(data.message.trim(), userId);
    safeSend(ws, result);
  } catch (err) {
    safeSend(ws, { type: 'error', text: err.message || 'Turn failed.' });
  }
}

module.exports = { onMessage };