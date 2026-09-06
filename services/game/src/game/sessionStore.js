const { getRoom, ROOMS } = require('./worldData');

const DEFAULT_USER_ID = 'dev-user';
const DEFAULT_GAME_ID = 'solo-dev';

function cloneRoom(roomId) {
  const template = getRoom(roomId);
  if (!template) return null;
  return {
    room_items: [...(template.room_items || [])],
    available_exits: [...(template.available_exits || [])],
    room_enemies: (template.room_enemies || []).map((e) => ({ ...e })),
  };
}

function createWorld() {
  const rooms = {};
  for (const roomId of Object.keys(ROOMS)) {
    rooms[roomId] = cloneRoom(roomId);
  }
  return {
    rooms,
    universeContext: 'Médiéval Fantastique',
    worldFlags: [],
    recentEvents: [],
  };
}

function createPlayer() {
  return {
    messagesHistory: [],
    playerStats: {
      hp: 60,
      max_hp: 100,
      location: 'donjon_test',
      inventory: [{ name: 'épée', type: 'weapon' }],
    },
  };
}

const worlds = new Map();
const players = new Map();

function playerKey(gameId, userId) {
  return `${gameId}:${userId}`;
}

function getWorld(gameId = DEFAULT_GAME_ID) {
  if (!worlds.has(gameId)) {
    worlds.set(gameId, createWorld());
  }
  return worlds.get(gameId);
}

function getPlayer(gameId = DEFAULT_GAME_ID, userId = DEFAULT_USER_ID) {
  const key = playerKey(gameId, userId);
  if (!players.has(key)) {
    players.set(key, createPlayer());
  }
  return players.get(key);
}

function getSession(gameId = DEFAULT_GAME_ID, userId = DEFAULT_USER_ID) {
  const world = getWorld(gameId);
  const player = getPlayer(gameId, userId);
  const location = player.playerStats.location;
  const room = world.rooms[location] || cloneRoom(location);

  if (!world.rooms[location]) {
    world.rooms[location] = room;
  }

  return {
    gameId,
    userId,
    messagesHistory: player.messagesHistory,
    playerStats: player.playerStats,
    worldState: {
      current_room: location,
      room_items: room.room_items,
      available_exits: room.available_exits,
      room_enemies: room.room_enemies,
    },
    universeContext: world.universeContext,
    worldFlags: world.worldFlags,
    recentEvents: world.recentEvents,
  };
}

function resetSession(gameId = DEFAULT_GAME_ID, userId = DEFAULT_USER_ID) {
  worlds.set(gameId, createWorld());
  players.set(playerKey(gameId, userId), createPlayer());
}

function resetGame(gameId = DEFAULT_GAME_ID) {
  worlds.set(gameId, createWorld());
  for (const key of [...players.keys()]) {
    if (key.startsWith(`${gameId}:`)) {
      players.delete(key);
    }
  }
}

module.exports = {
  getSession,
  resetSession,
  resetGame,
  getWorld,
  getPlayer,
  DEFAULT_USER_ID,
  DEFAULT_GAME_ID,
};