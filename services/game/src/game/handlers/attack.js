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
    
    const MAX_ROUNDS = 20;
    const rounds = [];
    let totalPlayerDamage = 0;
    let totalEnemyDamage = 0;
    let enemyKilled = false;
    let playerDefeated = false;

    for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum += 1) {

      const playerDamage = rollD6();
      enemy.hp = Math.max(0, enemy.hp - playerDamage);
      totalPlayerDamage += playerDamage;

      enemyKilled = enemy.hp === 0;
      const round = {
        round: roundNum,
        player_damage: playerDamage,
        enemy_hp_left: enemy.hp,
      };

      if (enemyKilled) {
        enemies.splice(index, 1);
        rounds.push(round);
        break;
      }
      
      const enemyDamage = rollD6();
      session.playerStats.hp = Math.max(0, session.playerStats.hp - enemyDamage);
      totalEnemyDamage += enemyDamage;
      round.enemy_damage = enemyDamage;
      round.player_hp_left = session.playerStats.hp;
      playerDefeated = session.playerStats.hp === 0;
      rounds.push(round);
      if (playerDefeated) {
        break;
      }
    }
  
    let outcome = 'ongoing';

    if (enemyKilled) outcome = 'victory';
    else if (playerDefeated) outcome = 'defeat';
    return {
      success: true,
      action: 'attack',
      target: enemy.name,
      weapon,
      auto_resolve: true,
      rounds,
      rounds_count: rounds.length,
      total_player_damage: totalPlayerDamage,
      total_enemy_damage: totalEnemyDamage,
      enemy_killed: enemyKilled,
      player_defeated: playerDefeated,
      outcome,
      player_hp_left: session.playerStats.hp,
      damage: totalPlayerDamage,
      hp_left: enemyKilled ? 0 : enemy.hp,
    };

}
  
  module.exports = { applyAttack };