00
01 crée vault_manager (le compte administratif que Vault utilise) et la base db_auth.
vault manager : sert uniquement à ce que Vault puisse créer et détruire des comptes Postgres temporaires
02 crée les tables users/refresh_tokens dans db_auth.