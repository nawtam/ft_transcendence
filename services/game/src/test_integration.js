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
 *
 * Enrichir : ajouter une fonction test_* et l'enregistrer dans SCENARIOS.
 */

const BASE_URL = process.env.GAME_URL || 'http://localhost:3001';
const IA_URL = process.env.IA_SERVICE_URL || 'http://ia:8000';

// ---------------------------------------------------------------------------
// Helpers HTTP
// ---------------------------------------------------------------------------

async function resetSession() {
  const res = await fetch(`${BASE_URL}/reset-session`, { method: 'POST' });
  if (!res.ok) throw new Error(`reset-session failed: ${res.status}`);
  return res.json();
}

async function testTurn(message) {
  const res = await fetch(`${BASE_URL}/test-turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `test-turn failed: ${res.status}`);
  return data;
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
  await resetSession();

  const data = await testTurn('Je ramasse la potion');

  report.add('type narration', data.type === 'narration', `got ${data.type}`);
  report.add('tool pickup_item', toolName(data) === 'pickup_item', `got ${toolName(data)}`);
  report.add('action picked_up', intentAction(data) === 'picked_up', `got ${intentAction(data)}`);
  report.add('game_result success', data.game_result?.success === true);
  report.add('item potion', data.game_result?.item?.name === 'potion', JSON.stringify(data.game_result?.item));

  const again = await testTurn('Je ramasse la potion');
  report.add('double pickup échoue', again.game_result?.success === false);
}

async function test_examine(report) {
  console.log('\n=== Scénario : examine ===');
  await resetSession();

  const data = await testTurn('Je regarde autour');

  report.add('tool examine', toolName(data) === 'examine', `got ${toolName(data)}`);
  report.add('action examine', intentAction(data) === 'examine');
  report.add('flavor_only', data.game_result?.flavor_only === true);
  report.add('description mentionne donjon', (data.game_result?.description || '').includes('donjon_test'));
  report.add('description mentionne potion', (data.game_result?.description || '').includes('potion'));
}

async function test_move(report) {
  console.log('\n=== Scénario : move ===');
  await resetSession();

  const move = await testTurn('Je vais à la forge');

  report.add('tool move_to', toolName(move) === 'move_to', `got ${toolName(move)}`);
  report.add('action move', intentAction(move) === 'move');
  report.add('move success', move.game_result?.success === true);
  report.add('destination forge', move.game_result?.destination === 'forge', move.game_result?.destination);

  const look = await testTurn('Je regarde autour');
  const desc = look.game_result?.description || '';
  report.add('dans la forge (examine)', desc.includes('forge'));
  report.add('plus de potion en salle', !desc.includes('potion'));

  const bad = await testTurn('Je vais à la forêt');
  report.add('move invalide échoue', bad.game_result?.success === false);
}

async function test_use(report) {
  console.log('\n=== Scénario : use ===');
  await resetSession();

  await testTurn('Je ramasse la potion');
  const data = await testTurn('Je bois la potion');

  report.add('tool use_item', toolName(data) === 'use_item', `got ${toolName(data)}`);
  report.add('action used', intentAction(data) === 'used');
  report.add('use success', data.game_result?.success === true);
  report.add('hp_gained 20 (60→80)', data.game_result?.hp_gained === 20, `got ${data.game_result?.hp_gained}`);
  report.add('new_hp 80', data.game_result?.new_hp === 80, `got ${data.game_result?.new_hp}`);

  const sword = await testTurn('Je bois mon epee');
  if (sword.type === 'clarification') {
    report.add('épée : clarification IA (skip game_result)', true, sword.text?.slice(0, 60));
  } else {
    report.add('épée non consumable échoue', sword.game_result?.success === false, sword.game_result?.error);
  }
}

async function test_attack(report) {
  console.log('\n=== Scénario : attack ===');
  await resetSession();

  const data = await testTurn('Je attaque l orc avec mon epee');

  report.add('tool attack_enemy', toolName(data) === 'attack_enemy', `got ${toolName(data)}`);
  report.add('action attack', intentAction(data) === 'attack');
  report.add('attack success', data.game_result?.success === true);

  const damage = data.game_result?.damage;
  report.add('damage 1-6', damage >= 1 && damage <= 6, `got ${damage}`);

  const hpLeft = data.game_result?.hp_left;
  report.add('hp_left cohérent', hpLeft === 30 - damage, `hp_left=${hpLeft}, damage=${damage}`);

  // Finir l'Orc (30 HP, max ~5 coups)
  let killed = data.game_result?.enemy_killed === true;
  for (let i = 0; i < 10 && !killed; i += 1) {
    const hit = await testTurn('Je attaque l orc avec mon epee');
    if (hit.game_result?.enemy_killed) killed = true;
    if (hit.game_result?.success === false && !killed) break;
  }
  report.add('orc tué', killed === true);

  const ghost = await testTurn('Je attaque l orc avec mon epee');
  report.add('attaque sans ennemi échoue', ghost.game_result?.success === false);
}

// Enregistrer les scénarios ici (ordre = ordre d'exécution)
const SCENARIOS = {
  pickup: test_pickup,
  examine: test_examine,
  move: test_move,
  use: test_use,
  attack: test_attack,
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
