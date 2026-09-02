const ROOMS = {
    donjon_test: {
      room_items: [{ name: 'potion', type: 'consumable' }],
      available_exits: ['forge'],
      room_enemies: [{ name: 'Orc', hp: 30, max_hp: 30 }],
    },
    forge: {
      room_items: [],
      available_exits: ['donjon_test'],
      room_enemies: [],
    },
  };
  
  function getRoom(roomId) {
    return ROOMS[roomId] || null;
  }
  
  module.exports = { ROOMS, getRoom };