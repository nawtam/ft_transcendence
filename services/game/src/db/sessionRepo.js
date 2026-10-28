const { pool } = require('./gamesRepo');

async function initSessionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_worlds (
      game_id TEXT PRIMARY KEY,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_players (
      game_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (game_id, user_id)
    )
  `);
}

async function saveWorld(gameId, world) {
  await pool.query(
    `INSERT INTO game_worlds (game_id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (game_id) DO UPDATE
       SET state = EXCLUDED.state, updated_at = now()`,
    [gameId, JSON.stringify(world)],
  );
}

async function savePlayer(gameId, userId, player) {
  await pool.query(
    `INSERT INTO game_players (game_id, user_id, state, updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (game_id, user_id) DO UPDATE
       SET state = EXCLUDED.state, updated_at = now()`,
    [gameId, String(userId), JSON.stringify(player)],
  );
}

async function deletePlayers(gameId) {
  await pool.query('DELETE FROM game_players WHERE game_id = $1', [gameId]);
}

async function loadSessions() {
  const worlds = await pool.query('SELECT game_id, state FROM game_worlds');
  const players = await pool.query('SELECT game_id, user_id, state FROM game_players');
  return {
    worlds: worlds.rows.map((row) => ({ gameId: row.game_id, state: row.state })),
    players: players.rows.map((row) => ({
      gameId: row.game_id,
      userId: row.user_id,
      state: row.state,
    })),
  };
}

module.exports = {
  initSessionTables,
  saveWorld,
  savePlayer,
  deletePlayers,
  loadSessions,
};