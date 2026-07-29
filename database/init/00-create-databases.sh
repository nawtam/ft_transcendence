#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

    CREATE USER auth_user WITH PASSWORD '$AUTH_DB_PASSWORD';
    CREATE USER game_user WITH PASSWORD '$GAME_DB_PASSWORD';
    CREATE USER ai_user   WITH PASSWORD '$AI_DB_PASSWORD';


    CREATE DATABASE jdr_auth;
    CREATE DATABASE jdr_game;
    CREATE DATABASE jdr_ai;

    GRANT ALL PRIVILEGES ON DATABASE jdr_auth TO auth_user;
    GRANT ALL PRIVILEGES ON DATABASE jdr_game TO game_user;
    GRANT ALL PRIVILEGES ON DATABASE jdr_ai   TO ai_user;
EOSQL