\c db_ai

CREATE EXTENSION IF NOT EXISTS vector;
GRANT ALL ON SCHEMA public TO ai_user;

CREATE TABLE IF NOT EXISTS lore_embeddings (
	id SERIAL PRIMARY KEY,
	universe_slug TEXT NOT NULL,
	file_path TEXT NOT NULL,
	content TEXT NOT NULL,
	embedding VECTOR(1536)
);

ALTER TABLE lore_embeddings OWNER TO ai_user;
