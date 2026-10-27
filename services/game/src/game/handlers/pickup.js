function normalizeName(name) {
    return (name || '').trim().toLowerCase();
  }
  
  function applyPickup(session, intent) {
    const itemName = intent?.args?.item_name || intent?.result?.item?.name;
    const itemType = intent?.args?.item_type || intent?.result?.item?.type || 'consumable';
  
    if (!itemName) {
      return { success: false, action: 'picked_up', error: 'Item name missing.' };
    }
  
    const wanted = normalizeName(itemName);
    const roomItems = session.worldState.room_items || [];
    const index = roomItems.findIndex((i) => normalizeName(i.name).includes(wanted) || wanted.includes(normalizeName(i.name)));
  
    if (index === -1) {
      return { success: false, action: 'picked_up', error: `Item '${itemName}' not in this room.` };
    }
  
    const [found] = roomItems.splice(index, 1);
    session.playerStats.inventory.push(found);
  
    return {
      success: true,
      action: 'picked_up',
      item: found,
    };
  }
  
  module.exports = { applyPickup };