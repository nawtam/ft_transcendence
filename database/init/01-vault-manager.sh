#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_USER" <<-EOSQL
    CREATE ROLE vault_manager WITH LOGIN PASSWORD '$VAULT_MANAGER_PASSWORD' CREATEROLE;
    CREATE DATABASE db_auth OWNER vault_manager;
EOSQL