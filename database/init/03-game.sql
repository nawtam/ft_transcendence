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