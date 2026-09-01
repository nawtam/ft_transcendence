function createDefaultSession() {
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
        room_items: [{ name: 'potion', type: 'consumable' }],
        available_exits: ['forge'],
        room_enemies: [{ name: 'Orc', hp: 30, max_hp: 30 }],
      },
      universeContext: 'Médiéval Fantastique',
      worldFlags: [],
      recentEvents: [],
    };
  }
  
  let session = createDefaultSession();
  
  function getSession() {
    return session;
  }
  
  function resetSession() {
    session = createDefaultSession();
  }
  
  module.exports = { getSession, resetSession, createDefaultSession };