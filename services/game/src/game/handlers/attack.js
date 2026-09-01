function normalizeName(name) {
    return (name || '').trim().toLowerCase();
  }
  
  function rollD6() {
    return Math.floor(Math.random() * 6) + 1;
  }
  
  function findEnemyIndex(enemies, wanted) {
    return enemies.findIndex(
      (e) =>
        normalizeName(e.name).includes(wanted) ||
        wanted.includes(normalizeName(e.name)),
    );
  }
  
  function hasWeapon(inventory, weaponName) {
    const wanted = normalizeName(weaponName);
    return inventory.some(
      (item) =>
        item.type === 'weapon' &&
        (normalizeName(item.name).includes(wanted) ||
          wanted.includes(normalizeName(item.name))),
    );
  }
  
  function applyAttack(session, intent) {
    const target = intent?.args?.target || intent?.result?.target;
    const weapon = intent?.args?.weapon || intent?.result?.weapon;
  
    if (!target) {
      return { success: false, action: 'attack', error: 'Target missing.' };
    }
    if (!weapon) {
      return { success: false, action: 'attack', error: 'Weapon missing.' };
    }
  
    const inventory = session.playerStats.inventory || [];
    if (!hasWeapon(inventory, weapon)) {
      return {
        success: false,
        action: 'attack',
        error: `Weapon '${weapon}' not in inventory.`,
      };
    }
  
    const wanted = normalizeName(target);
    const enemies = session.worldState.room_enemies || [];
    const index = findEnemyIndex(enemies, wanted);
  
    if (index === -1) {
      return {
        success: false,
        action: 'attack',
        error: `Enemy '${target}' not in this room.`,
      };
    }
  
    const enemy = enemies[index];
    const damage = rollD6();
    enemy.hp = Math.max(0, enemy.hp - damage);
  
    const result = {
      success: true,
      action: 'attack',
      target: enemy.name,
      weapon,
      damage,
      hp_left: enemy.hp,
      enemy_killed: false,
    };
  
    if (enemy.hp === 0) {
      enemies.splice(index, 1);
      result.enemy_killed = true;
    }
  
    return result;
  }
  
  module.exports = { applyAttack };