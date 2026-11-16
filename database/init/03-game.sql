\c db_game

GRANT ALL ON SCHEMA public TO game_user;

CREATE TABLE IF NOT EXISTS games (
    game_id TEXT PRIMARY KEY,
    visibilite TEXT NOT NULL,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE games OWNER TO game_user;

CREATE TABLE IF NOT EXISTS game_worlds (
    game_id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_players (
    game_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (game_id, user_id)
);

ALTER TABLE game_worlds OWNER TO game_user;
ALTER TABLE game_players OWNER TO game_user;

CREATE TABLE IF NOT EXISTS player_stat (
    user_id TEXT PRIMARY KEY,
    games_played INTEGER NOT NULL DEFAULT 0,
    victories INTEGER NOT NULL DEFAULT 0,
    defeats INTEGER NOT NULL DEFAULT 0,
    total_xp INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS match_history (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL,
    universe_slug TEXT NOT NULL,
    game_mode TEXT NOT NULL,
    winner_id TEXT,
    duration_sec INTEGER NOT NULL DEFAULT 0,
    played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE player_stat OWNER TO game_user;
ALTER TABLE match_history OWNER TO game_user;
