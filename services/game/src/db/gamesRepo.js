const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'postgres',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'game_user',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || 'db_game',
});

async function initGamesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS games (
      game_id TEXT PRIMARY KEY,
      visibilite TEXT NOT NULL,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function saveGame(game) {
  await pool.query(
    `INSERT INTO games (game_id, visibilite, state, updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (game_id) DO UPDATE
       SET visibilite = EXCLUDED.visibilite,
           state = EXCLUDED.state,
           updated_at = now()`,
    [game.gameId, game.visibilite, JSON.stringify(game)],
  );
}

async function loadGames() {
  const { rows } = await pool.query('SELECT state FROM games ORDER BY updated_at');
  return rows.map((row) => row.state);
}

module.exports = { pool, initGamesTable, saveGame, loadGames };