/**
 * Tests d'intégration Game (HTTP + IA).
 *
 * Prérequis :
 *   docker compose up -d --build game ia postgres
 *
 * Lancer :
 *   docker compose exec game node src/test_integration.js
 *
 * Filtrer un scénario (optionnel) :
 *   docker compose exec game env TEST_SCENARIO=pickup node src/test_integration.js
 *   docker compose exec game env TEST_SCENARIO=shared_world node src/test_integration.js
 *
 * Enrichir : ajouter une fonction test_* et l'enregistrer dans SCENARIOS.
 */

const BASE_URL = process.env.GAME_URL || 'http://localhost:3001';
const IA_URL = process.env.IA_SERVICE_URL || 'http://ia:8000';

// ---------------------------------------------------------------------------
// Helpers HTTP
// ---------------------------------------------------------------------------

async function resetSession(gameId = 'solo-dev') {
  const res = await fetch(`${BASE_URL}/reset-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId }),
  });
  if (!res.ok) throw new Error(`reset-session failed: ${res.status}`);
  return res.json();
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testTurn(message, { userId = 'dev-user', gameId = 'solo-dev' } = {}) {
  const res = await fetch(`${BASE_URL}/test-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId, gameId }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`test-turn failed: ${res.status} (invalid JSON)`);
  }
  if (!res.ok) throw new Error(data.error || `test-turn failed: ${res.status}`);
  return data;
}

/** Retry once on network blips (ECONNRESET) after a short pause. */
async function testTurnRetry(message, opts = {}) {
  try {
    return await testTurn(message, opts);
  } catch (err) {
    const msg = err.message || '';
    if (!/ECONNRESET|fetch failed|503|502/i.test(msg)) throw err;
    await sleep(2000);
    return testTurn(message, opts);
  }
}

async function checkHealth(url, label) {
  const res = await fetch(`${url}/health`);
  if (!res.ok) throw new Error(`${label} health check failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------

class SuiteReport {
  constructor() {
    this.checks = [];
  }

  add(name, ok, detail = '') {
    this.checks.push({ name, ok, detail });
    const icon = ok ? 'OK' : 'FAIL';
    const extra = detail ? ` — ${detail}` : '';
    console.log(`  [${icon}] ${name}${extra}`);
  }

  summary() {
    const passed = this.checks.filter((c) => c.ok).length;
    const total = this.checks.length;
    console.log('\n' + '='.repeat(44));
    console.log(`Résultat : ${passed}/${total} checks passés`);
    return passed === total ? 0 : 1;
  }
}

function intentAction(data) {
  return data?.intent?.result?.action;
}

function toolName(data) {
  return data?.intent?.tool_name;
}

// ---------------------------------------------------------------------------
// Scénarios — ajouter ici au fur et à mesure
// ---------------------------------------------------------------------------

async function test_pickup(report) {
  console.log('\n=== Scénario : pickup ===');
  const gameId = 'test-pickup';
  await resetSession(gameId);

  const data = await testTurn('Je ramasse la potion', { gameId });

  report.add('type narration', data.type === 'narration', `got ${data.type}`);
  report.add('tool pickup_item', toolName(data) === 'pickup_item', `got ${toolName(data)}`);
  report.add('action picked_up', intentAction(data) === 'picked_up', `got ${intentAction(data)}`);
  report.add('game_result success', data.game_result?.success === true);
  report.add('item potion', data.game_result?.item?.name === 'potion', JSON.stringify(data.game_result?.item));

  const again = await testTurn('Je ramasse la potion', { gameId });
  report.add('double pickup échoue', again.game_result?.success === false);
}

async function test_examine(report) {
  console.log('\n=== Scénario : examine ===');
  const gameId = 'test-examine';
  await resetSession(gameId);

  const data = await testTurn('Je regarde autour', { gameId });

  report.add('tool examine', toolName(data) === 'examine', `got ${toolName(data)}`);
  report.add('action examine', intentAction(data) === 'examine');
  report.add('flavor_only', data.game_result?.flavor_only === true);
  report.add('description mentionne donjon', (data.game_result?.description || '').includes('donjon_test'));
  report.add('description mentionne potion', (data.game_result?.description || '').includes('potion'));
}

async function test_move(report) {
  console.log('\n=== Scénario : move ===');
  const gameId = 'test-move';
  await resetSession(gameId);

  const move = await testTurn('Je vais à la forge', { gameId });

  report.add('tool move_to', toolName(move) === 'move_to', `got ${toolName(move)}`);
  report.add('action move', intentAction(move) === 'move');
  report.add('move success', move.game_result?.success === true);
  report.add('destination forge', move.game_result?.destination === 'forge', move.game_result?.destination);

  const look = await testTurn('Je regarde autour', { gameId });
  const desc = look.game_result?.description || '';
  report.add('dans la forge (examine)', desc.includes('forge'));
  report.add('plus de potion en salle', !desc.includes('potion'));

  const bad = await testTurn('Je vais a la foret noire inexistante', { gameId });
  if (bad.type === 'clarification') {
    report.add('move invalide : clarification IA', true, bad.text?.slice(0, 60));
  } else {
    report.add(
      'move invalide échoue',
      bad.game_result?.success === false,
      bad.game_result?.error || bad.type,
    );
  }
}

async function test_use(report) {
  console.log('\n=== Scénario : use ===');
  const gameId = 'test-use';
  await resetSession(gameId);

  await testTurn('Je ramasse la potion', { gameId });
  const data = await testTurn('Je bois la potion', { gameId });

  report.add('tool use_item', toolName(data) === 'use_item', `got ${toolName(data)}`);
  report.add('action used', intentAction(data) === 'used');
  report.add('use success', data.game_result?.success === true);
  report.add('hp_gained 20 (60→80)', data.game_result?.hp_gained === 20, `got ${data.game_result?.hp_gained}`);
  report.add('new_hp 80', data.game_result?.new_hp === 80, `got ${data.game_result?.new_hp}`);

  const sword = await testTurn('Je bois mon epee', { gameId });
  if (sword.type === 'clarification') {
    report.add('épée : clarification IA (skip game_result)', true, sword.text?.slice(0, 60));
  } else {
    report.add('épée non consumable échoue', sword.game_result?.success === false, sword.game_result?.error);
  }
}

async function test_attack(report) {
  console.log('\n=== Scénario : attack (auto-resolve) ===');
  const gameId = 'test-attack';
  await resetSession(gameId);

  // Un seul message = combat entier (plus de boucle de testTurn)
  const data = await testTurn('Je attaque l orc avec mon epee', { gameId });
  const gr = data.game_result || {};

  report.add('tool attack_enemy', toolName(data) === 'attack_enemy', `got ${toolName(data)}`);
  report.add('action attack', intentAction(data) === 'attack');
  report.add('attack success', gr.success === true);
  report.add('auto_resolve', gr.auto_resolve === true);
  report.add('au moins 1 round', (gr.rounds_count || 0) >= 1, `rounds_count=${gr.rounds_count}`);
  report.add('rounds tableau', Array.isArray(gr.rounds) && gr.rounds.length === gr.rounds_count);

  const ended = gr.enemy_killed === true || gr.player_defeated === true;
  report.add(
    'combat terminé (victory ou defeat)',
    ended === true && (gr.outcome === 'victory' || gr.outcome === 'defeat'),
    `outcome=${gr.outcome}, killed=${gr.enemy_killed}, defeated=${gr.player_defeated}`,
  );

  if (gr.enemy_killed) {
    report.add('outcome victory', gr.outcome === 'victory');
    report.add('hp_left 0', gr.hp_left === 0);
    report.add(
      'total_player_damage cohérent',
      gr.total_player_damage >= 30,
      `got ${gr.total_player_damage}`,
    );

    try {
      const ghost = await testTurnRetry('Je attaque l orc avec mon epee', { gameId });
      report.add(
        'attaque sans ennemi échoue',
        ghost.game_result?.success === false || ghost.type === 'clarification',
        ghost.game_result?.error || ghost.type,
      );
    } catch (err) {
      report.add('attaque sans ennemi échoue', false, err.message);
    }
  } else {
    report.add('outcome defeat', gr.outcome === 'defeat');
    report.add('player_hp_left 0', gr.player_hp_left === 0);
    report.add('attaque sans ennemi (skip: joueur KO)', true);
  }
}

/**
 * Monde partagé : même gameId → 2 joueurs voient le même monde.
 * gameId différents → mondes isolés (solo / autre partie).
 */
async function test_shared_world(report) {
  console.log('\n=== Scénario : shared_world ===');
  const party1 = 'test-party-1';
  const party2 = 'test-party-2';

  await resetSession(party1);
  await resetSession(party2);

  try {
    const pickup = await testTurnRetry('Je ramasse la potion', {
      userId: 'user-1',
      gameId: party1,
    });
    report.add(
      'user-1 pickup party-1',
      pickup.game_result?.success === true && pickup.game_result?.item?.name === 'potion',
      JSON.stringify(pickup.game_result),
    );

    const lookSame = await testTurnRetry('Je regarde autour', {
      userId: 'user-2',
      gameId: party1,
    });
    const descSame = lookSame.game_result?.description || '';
    report.add(
      'user-2 party-1 : potion absente (monde partagé)',
      descSame.includes('aucun') && !descSame.includes('potion'),
      descSame,
    );

    const lookOther = await testTurnRetry('Je regarde autour', {
      userId: 'user-3',
      gameId: party2,
    });
    const descOther = lookOther.game_result?.description || '';
    report.add(
      'user-3 party-2 : potion encore là (monde isolé)',
      descOther.includes('potion'),
      descOther,
    );
  } catch (err) {
    report.add('shared_world — exception', false, err.message);
  }
}

// Enregistrer les scénarios ici (ordre = ordre d'exécution)
const SCENARIOS = {
  pickup: test_pickup,
  examine: test_examine,
  move: test_move,
  use: test_use,
  attack: test_attack,
  shared_world: test_shared_world,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Game integration tests');
  console.log(`  game → ${BASE_URL}`);
  console.log(`  ia   → ${IA_URL}`);

  try {
    await checkHealth(BASE_URL, 'game');
    console.log('[OK] game /health');
    await checkHealth(IA_URL, 'ia');
    console.log('[OK] ia /health');
  } catch (err) {
    console.error(`\nServices indisponibles : ${err.message}`);
    console.error('Lance : docker compose up -d --build game ia postgres');
    process.exit(1);
  }

  const filter = process.env.TEST_SCENARIO;
  const entries = filter
    ? Object.entries(SCENARIOS).filter(([name]) => name === filter)
    : Object.entries(SCENARIOS);

  if (filter && entries.length === 0) {
    console.error(`Scénario inconnu : "${filter}". Disponibles : ${Object.keys(SCENARIOS).join(', ')}`);
    process.exit(1);
  }

  const report = new SuiteReport();

  for (const [name, fn] of entries) {
    try {
      await fn(report);
    } catch (err) {
      report.add(`${name} — exception`, false, err.message);
    }
  }

  process.exit(report.summary());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
