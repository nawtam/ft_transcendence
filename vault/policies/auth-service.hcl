# Policy du service auth.

# Lecture de la paire de clés RS256 (KV v2)
path "secret/data/auth/jwt" {
  capabilities = ["read"]
}

# Génération des comptes Postgres temporaires
path "database/creds/auth-db-role" {
  capabilities = ["read"]
}

# Prolonger le bail d'un compte Postgres temporaire
path "sys/leases/renew" {
  capabilities = ["update"]
}

# Prolonger son propre token Vault
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Révoquer son propre token à l'arrêt (supprime aussi le compte Postgres)
path "auth/token/revoke-self" {
  capabilities = ["update"]
}
