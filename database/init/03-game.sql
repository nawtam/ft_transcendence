\c db_game

GRANT ALL ON SCHEMA public TO game_user;

CREATE TABLE IF NOT EXISTS games (
    game_id TEXT PRIMARY KEY,
    visibilite TEXT NOT NULL,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE games OWNER TO game_user;