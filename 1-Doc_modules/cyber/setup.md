# Setup Vault + Postgres pour le service `auth`

Ce setup se fait **en local, sur la machine de chacun**. Rien n'est partagé via git : chaque personne génère ses propres clés, son propre Vault, ses propres secrets. Le `.gitignore` protège déjà les fichiers sensibles, mais vérifiez-le après votre premier setup.

Prévoir **20-30 min**, tranquille, en suivant l'ordre exact.

---

## 0. Prérequis

- Docker installé, et ton utilisateur dans le groupe `docker` :
  ```bash
  groups $USER   # doit contenir "docker"
  ```
  Si ce n'est pas le cas : `sudo usermod -aG docker $USER`, puis déconnexion/reconnexion de session.

---

## 1. Récupérer le code et compléter le `.env`

```bash
git pull
cp .env.example .env   # si pas déjà fait
```

Remplis dans `.env` (mots de passe forts, différents de ceux des autres) :
```
POSTGRES_ADMIN_USER=...
POSTGRES_ADMIN_PASSWORD=...
GAME_DB_PASSWORD=...
AI_DB_PASSWORD=...
VAULT_MANAGER_PASSWORD=...
```
Laisse `AUTH_VAULT_ROLE_ID` vide pour l'instant, on le remplit à l'étape 6.

---

## 2. Démarrer Postgres (premier démarrage = auto-init)

```bash
docker compose up -d postgres
docker compose logs postgres
```

Vérifie qu'il n'y a **aucune erreur** dans les logs, et que tu vois bien s'exécuter dans l'ordre :
`00-create-databases.sh` → `01-vault-manager.sh` → `02-auth-schema.sql`

⚠️ Si tu relances plusieurs fois et que ça ne fonctionne pas, vérifie que le volume `pgdata` est bien vide (ces scripts ne s'exécutent qu'au tout premier démarrage d'un volume).

---

## 3. Démarrer Vault et l'initialiser (une seule fois)

```bash
docker compose up -d vault
docker compose exec vault vault status   # doit afficher Sealed: true, Initialized: false
docker compose exec vault vault operator init
```

**Sauvegarde immédiatement les 5 "Unseal Key" et le "Initial Root Token"** dans ton gestionnaire de mots de passe personnel. Si tu les perds, il n'y a aucun moyen de les récupérer — il faudrait tout recommencer.

---

## 4. Désceller Vault

```bash
docker compose exec vault vault operator unseal
```
×3, avec 3 clés différentes parmi les 5.

⚠️ **À refaire à chaque redémarrage du conteneur Vault** (`docker compose down`/`up`, reboot machine, etc.) — c'est voulu, c'est le principe de l'unseal manuel.

Puis connecte-toi avec le root token :
```bash
docker compose exec vault vault login
```

---

## 5. Activer KV et générer ta clé JWT (RS256)

```bash
docker compose exec vault vault secrets enable -path=secret kv-v2
```

Génère ta paire de clés (sur ta machine hôte) :
```bash
mkdir -p /tmp/jwt-keys
openssl genrsa -out /tmp/jwt-keys/private.pem 2048
openssl rsa -in /tmp/jwt-keys/private.pem -pubout -out /tmp/jwt-keys/public.pem

docker compose cp /tmp/jwt-keys/private.pem vault:/tmp/private.pem
docker compose cp /tmp/jwt-keys/public.pem vault:/tmp/public.pem

docker compose exec vault vault kv put secret/auth/jwt \
  private_key=@/tmp/private.pem \
  public_key=@/tmp/public.pem

docker compose exec vault rm -f /tmp/private.pem /tmp/public.pem
rm -rf /tmp/jwt-keys
```

---

## 6. Configurer le moteur `database` (credentials Postgres dynamiques)

```bash
docker compose exec vault vault secrets enable database

docker compose exec vault vault write database/config/postgres-db \
  plugin_name=postgresql-database-plugin \
  connection_url="postgresql://{{username}}:{{password}}@postgres:5432/db_auth?sslmode=disable" \
  allowed_roles="auth-db-role" \
  username="vault_manager" \
  password="<ta valeur de VAULT_MANAGER_PASSWORD dans .env>"

docker compose exec vault vault write database/roles/auth-db-role \
  db_name=postgres-db \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}' IN ROLE auth_role;" \
  default_ttl="1h" \
  max_ttl="24h"
```

Test rapide (optionnel mais conseillé) :
```bash
docker compose exec vault vault read database/creds/auth-db-role
```
Tu dois voir un `username`/`password` générés. Tu peux le révoquer juste après avec le `lease_id` affiché :
```bash
docker compose exec vault vault lease revoke <lease_id>
```

---

## 7. Créer la policy et l'AppRole pour le service `auth`

```bash
docker compose exec -T vault sh -c 'vault policy write auth-service -' << 'EOF'
path "secret/data/auth/jwt" {
  capabilities = ["read"]
}

path "database/creds/auth-db-role" {
  capabilities = ["read"]
}
EOF

docker compose exec vault vault auth enable approle

docker compose exec vault vault write auth/approle/role/auth-service \
  token_policies="auth-service" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=0 \
  secret_id_num_uses=0
```

---

## 8. Récupérer le `role_id` et le `secret_id`

```bash
docker compose exec vault vault read auth/approle/role/auth-service/role-id
```
Copie la valeur `role_id` dans ton `.env` :
```
AUTH_VAULT_ROLE_ID=<valeur>
```

```bash
docker compose exec vault vault write -f auth/approle/role/auth-service/secret-id
```
Copie la valeur `secret_id` (**pas dans `.env`**, dans un fichier dédié) :
```bash
mkdir -p ./services/auth/secrets
echo -n "<valeur secret_id>" > ./services/auth/secrets/vault_secret_id.txt
```

---

## 9. Vérifier que rien de sensible n'est trackable par git

```bash
git check-ignore -v .env
git check-ignore -v ./services/auth/secrets/vault_secret_id.txt
```
Les deux commandes doivent afficher une ligne (confirmant qu'ils sont bien ignorés). Si l'une d'elles n'affiche rien, **ne commit rien** avant d'avoir corrigé le `.gitignore`.

---

## Ce qu'il faut retenir

- **Le `role_id`** (peu sensible) va dans `.env`.
- **Le `secret_id`** (le vrai secret) va dans `./services/auth/secrets/vault_secret_id.txt`, jamais dans `.env`.
- **Les 5 clés de unseal + le root token** vont dans ton gestionnaire de mots de passe personnel, jamais dans le repo.
- À chaque redémarrage du conteneur `vault`, il faut redésceller à la main (3 clés parmi les 5).
- Chacun a son propre Vault local, sa propre clé JWT, sa propre AppRole — rien de tout ça n'est partagé entre les machines de l'équipe.

Des questions ou un blocage → gueulez sur le channel, mieux vaut demander que de rester bloqué 1h sur une histoire de TTY ou de YAML mal indenté 😄