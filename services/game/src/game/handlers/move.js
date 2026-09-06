const { getRoom } = require('../worldData');

function normalizeId(id) {
  return (id || '').trim().toLowerCase();
}

function applyMove(session, intent) {
  const destination =
    intent?.args?.destination ||
    intent?.result?.destination;

  if (!destination) {
    return {
      success: false,
      action: 'move',
      error: 'Destination missing.',
    };
  }

  const dest = normalizeId(destination);
  const exits = session.worldState.available_exits || [];
  const allowed = exits.map(normalizeId);

  if (!allowed.includes(dest)) {
    return {
      success: false,
      action: 'move',
      error: `Cannot go to '${destination}' from here. Exits: ${exits.join(', ') || 'none'}.`,
    };
  }

  const room = getRoom(dest);
  if (!room) {
    return {
      success: false,
      action: 'move',
      error: `Unknown room '${destination}'.`,
    };
  }

  const previousRoom = session.worldState.current_room;
  session.playerStats.location = dest;

    return {
    success: true,
    action: 'move',
    from: previousRoom,
    destination: dest,
    };
}

module.exports = { applyMove };