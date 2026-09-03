const { getRoom } = require('./worldData');

const DEFAULT_USER_ID = 'dev-user';

function createDefaultSession() {
  const startRoom = getRoom('donjon_test');
  return {
    messagesHistory: [],
    playerStats: {
      hp: 60,
      max_hp: 100,
      location: 'donjon_test',
      inventory: [{ name: 'épée', type: 'weapon' }],
    },
    worldState: {
      current_room: 'donjon_test',
      room_items: [...(startRoom?.room_items || [])],
      available_exits: [...(startRoom?.available_exits || [])],
      room_enemies: (startRoom?.room_enemies || []).map((e) => ({ ...e })),
    },
    universeContext: 'Médiéval Fantastique',
    worldFlags: [],
    recentEvents: [],
  };
}

const sessions = new Map();

function getSession(userId = DEFAULT_USER_ID) {
  if (!sessions.has(userId)) {
    sessions.set(userId, createDefaultSession());
  }
  return sessions.get(userId);
}

function resetSession(userId = DEFAULT_USER_ID) {
  sessions.set(userId, createDefaultSession());
}

module.exports = {
  getSession,
  resetSession,
  createDefaultSession,
  DEFAULT_USER_ID,
};