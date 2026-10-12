-- Index de la base db_auth pour le service auth.
\connect db_auth

-- /auth/refresh et /auth/logout cherchent un jeton par son empreinte.
CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_hash_key
    ON refresh_tokens (token_hash);

-- Le ménage à la connexion filtre les jetons d'un joueur.
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx
    ON refresh_tokens (user_id);

-- Unicité du pseudo sans tenir compte des majuscules, garantie par la base.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
    ON users (lower(username));