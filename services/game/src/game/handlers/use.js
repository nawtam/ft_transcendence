const HEAL_AMOUNT = 20;

function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

function findInventoryIndex(inventory, wanted) {
  return inventory.findIndex(
    (i) =>
      normalizeName(i.name).includes(wanted) ||
      wanted.includes(normalizeName(i.name)),
  );
}

function applyUse(session, intent) {
  const itemName =
    intent?.args?.item_name ||
    intent?.result?.item_name;

  if (!itemName) {
    return { success: false, action: 'used', error: 'Item name missing.' };
  }

  const wanted = normalizeName(itemName);
  const inventory = session.playerStats.inventory || [];
  const index = findInventoryIndex(inventory, wanted);

  if (index === -1) {
    return {
      success: false,
      action: 'used',
      error: `Item '${itemName}' not in inventory.`,
    };
  }

  const item = inventory[index];

  if (item.type !== 'consumable') {
    return {
      success: false,
      action: 'used',
      error: `'${item.name}' cannot be used (type: ${item.type}).`,
    };
  }

  const previousHp = session.playerStats.hp;
  inventory.splice(index, 1);

  const healed = Math.min(HEAL_AMOUNT, session.playerStats.max_hp - previousHp);
  session.playerStats.hp = previousHp + healed;

  return {
    success: true,
    action: 'used',
    item,
    hp_gained: healed,
    new_hp: session.playerStats.hp,
    max_hp: session.playerStats.max_hp,
  };
}

module.exports = { applyUse };