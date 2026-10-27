function applyExamine(session, intent) {
    const target = intent?.args?.target || intent?.result?.target || 'room';
    const room = session.worldState.current_room;
    const items = (session.worldState.room_items || []).map((i) => i.name);
    const exits = session.worldState.available_exits || [];
  
    return {
      success: true,
      action: 'examine',
      flavor_only: true,
      target,
      description: `Salle: ${room}. Objets: ${items.join(', ') || 'aucun'}. Sorties: ${exits.join(', ') || 'aucune'}.`,
    };
  }
  
  module.exports = { applyExamine };