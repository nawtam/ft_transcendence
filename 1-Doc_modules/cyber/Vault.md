# introduction

vault produit opensource de gestion de secret
automatiser l'acces : au secrets, aux données, aux système

permet le stockage et le controle au accès : token, psw, certificats et clé de chiffrement
peut etre utilisé : ligne de commande, API, meme UI, plateforme cloud

vault fonctionne comme un application client serveur. ou le client interagit avec le back end via une connexion tls pour acceder au stockage

quand le serv tourne utiliser un client vault pour recupéré des secret stocké en utilisant l'ip et le port du serv et un jeton vault


Les identifiants sont des données statiques 
Une policy, dans Vault, c'est une liste de permissions


# Vault dans Docker-compose

#### 1. Le volume vault-data
écrit ses données chiffrées sur disque, pour ne pas les perdre a chaque down


#### 2. Le service vault

*cap_add: - IPC_LOCK*  : 
cest quoi la prochaine etape

cap_add: - IPC_LOCK, expliqué depuis le début
Le problème que ça résout
Ton ordinateur a de la RAM (rapide, mais limitée) et un disque (plus lent, mais bien plus grand). Quand la RAM est pleine, le système d'exploitation (Linux) a un mécanisme appelé le swap : il prend des blocs de mémoire RAM peu utilisés, les écrit temporairement sur le disque, et libère la RAM pour autre chose. C'est totalement transparent pour les programmes — ils ne savent même pas que ça arrive.

Le souci : Vault stocke des secrets déchiffrés en RAM pendant qu'il tourne (la clé JWT privée, par exemple, une fois lue depuis son stockage chiffré sur disque). Si le système décide de swapper cette zone mémoire sur le disque, ton secret se retrouve écrit en clair dans le fichier de swap du disque — potentiellement de façon persistante, lisible par quiconque a accès au disque plus tard (y compris après extinction), même si tu penses que le secret n'a "jamais quitté la RAM".

Le mécanisme qui protège contre ça
Linux propose un appel système (syscall) appelé mlock() : un programme peut demander au noyau "cette zone de mémoire précise, ne la swap jamais, quoi qu'il arrive". Vault appelle mlock() sur les zones mémoire où il garde des secrets déchiffrés. C'est ce qu'on appelle le memory locking.

Le problème : mlock() est un privilège que Linux ne donne pas par défaut à un processus. Il faut la capability IPC_LOCK (les "capabilities" Linux sont des permissions granulaires, plus fines que "root ou pas root" — IPC_LOCK est spécifiquement celle qui autorise à verrouiller de la mémoire).

Docker, par sécurité, retire par défaut la plupart des capabilities Linux aux conteneurs (pour limiter ce qu'un conteneur compromis pourrait faire). IPC_LOCK en fait partie.

Ce que fait concrètement la ligne
yaml
cap_add:
  - IPC_LOCK
Ça redonne uniquement cette capability précise au conteneur vault (pas toutes les capabilities, pas les droits root complets — juste celle-là). Résultat : Vault peut appeler mlock() avec succès, ses secrets en mémoire ne finissent jamais sur le disque via le swap.

Sans cette ligne : Vault démarre, essaie de verrouiller sa mémoire, l'appel système échoue (permission refusée), et Vault refuse de démarrer en te renvoyant une erreur explicite (Error initializing core: Failed to lock memory: cannot allocate memory) — sauf si on lui dit explicitement de continuer sans cette protection (disable_mlock = true dans le .hcl), ce que je ne veux pas faire ici puisque ta démarche est justement de ne pas contourner ces mécanismes.

*vault-data:/vault/data* → c'est le chemin que le storage "file" du vault.hcl utilise pour écrire (voir plus bas).
*./vault/config:/vault/config* → monte ton fichier de config local dans le conteneur, en lecture. Ça te permet de modifier vault.hcl sur ta machine sans reconstruire l'image.

*environnement* : adresse que le CLI vault urilise par defaut
*entrypoint* : Remplace l'entrypoint par défaut de l'image pour forcer le démarrage en mode serveur avec configuration fichier

#### 3. Les changements sur auth

*VAULT_ADDR* = adresse vault
**VAULT_ROLE_ID:*  =pour que vault capte quel service cest


# Le fichier vault.hcl

HCL (HashiCorp Configuration Language) est le format de config natif des outils HashiCorp. Ce fichier dit à Vault : comment stocker ses données, sur quelle interface écouter, et quelques métadonnées

*storage* = ou vault va persisté, on va les mettre dans un file c'esst un choix standard

*listener* = interface resau de l'API vault



une clé privée (private.pem) et une clé publique (public.pem) correspondante. Ce sont ces deux clés qui serviront plus tard pour signer/vérifier les JWT en RS256 :
auth utilisera la clé privée pour signer les tokens (prouver "c'est bien moi qui ai émis ce token").
game utilisera la clé publique pour vérifier les tokens (confirmer que le token a bien été signé par auth) — sans jamais pouvoir en fabriquer lui-même, puisqu'il n'a pas la clé privée.

commande pour lire ces clé :
```docker compose exec vault vault kv get -field=private_key secret/auth/jwt```

```docker compose exec vault vault kv get -field=public_key secret/auth/jwt```


auth-db-role : configuration à l'intérieur de Vault (database/roles/auth-db-role), cest lui qui distribue des badge d'accès temporaire

auth-db-role (une config de compte DANS Vault)
        │
        │ Vault LIT cette config quand on la lui demande
        ▼
Vault génère lui-même un mot de passe aléatoire
        │
        │ Vault remplit la config sur Postgres (via vault_manager)
        ▼
Un nouveau compte Postgres apparaît, avec ce mot de passe généré
        │
        │ Vault RENVOIE ce compte (username + password) au demandeur
        ▼
Le service `auth` reçoit ce credential et s'en sert.

Vault va chercher la définition/config stockée à database/roles/auth-db-role.
Vault génère aléatoirement un nom de compte (v-token-...) et un mot de passe, personne ne les choisit à l'avance.
Vault exécute le SQL défini dedans (le creation_statements, le CREATE ROLE ...), en se connectant à Postgres avec l'identité vault_manager.
Un vrai compte Postgres, temporaire, membre de auth_role.
Le service auth peut mtn se connecter à postgres par l'intermédiaire de ce compte


```docker compose exec vault vault write database/roles/auth-db-role \
  db_name=postgres-db \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}' IN ROLE auth_role;" \
  default_ttl="1h" \
  max_ttl="24h"```

---- 
docker compose exec vault

Exécute ce qui suit à l'intérieur du conteneur vault — là où le binaire vault (le CLI) est installé. Comme d'habitude, c'est juste le moyen d'atteindre l'outil, pas la commande Vault elle-même.
vault write = la commande générique pour "écrire/créer une configuration" dans Vault, à un chemin donné. Ici le chemin est database/roles/auth-db-role :

db_name=postgres-db
Indique à Vault sur quelle connexion exécuter le SQL qui va suivre. postgres-db est le nom qu'on a donné à la connexion Postgres, à l'étape 2 (vault write database/config/postgres-db ...). Sans ce paramètre, Vault ne saurait pas quel serveur Postgres contacter.

creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}' IN ROLE auth_role;"
C'est le cœur de la commande — le SQL brut que Vault va exécuter littéralement, tel quel, à chaque fois qu'on lui demandera un credential. Décomposons ce SQL :

CREATE ROLE "{{name}}" : crée un rôle Postgres. {{name}} est un placeholder — Vault le remplace, au moment de l'exécution, par un nom qu'il génère lui-même (format type v-token-auth-db-role-x7f2a9). Les guillemets doubles \"..\" sont nécessaires en SQL Postgres parce que ce nom contient des tirets, que Postgres n'accepterait pas dans un identifiant non-quoté.
WITH LOGIN : ce rôle a le droit de se connecter (sinon ce serait juste un groupe, comme auth_role).
PASSWORD '{{password}}' : autre placeholder, remplacé par un mot de passe aléatoire généré par Vault.
VALID UNTIL '{{expiration}}' : troisième placeholder, remplacé par une date/heure calculée par Vault (maintenant + default_ttl). C'est une contrainte native de Postgres — même si Vault oubliait de supprimer ce compte, Postgres refuserait lui-même toute connexion après cette date.
IN ROLE auth_role : rattache ce nouveau compte au rôle-conteneur auth_role créé dans 02-auth-schema.sql — c'est ce qui lui donne accès aux tables users/refresh_tokens, sans GRANT explicite à écrire ici.
Les \" : des guillemets échappés, nécessaires parce qu'on est déjà à l'intérieur d'une chaîne de caractères bash délimitée par des guillemets doubles — sans l'échappement, bash penserait que la chaîne s'arrête plus tôt qu'elle ne le devrait.
default_ttl="1h"

Durée de vie par défaut d'un compte généré par cette règle — si personne ne précise autre chose au moment de la demande, chaque compte vivra 1h avant expiration automatique (Postgres le refuse après, et Vault le supprime activement de son côté aussi).

max_ttl="24h"
Plafond absolu, même avec des renouvellements (renew) successifs. Un compte ne peut jamais dépasser 24h d'existence totale, peu importe combien de fois on l'a renouvelé.


Policy pour auth-service: lire la clé JWT, et générer un credential Postgres via auth-db-role
AppRole, c'est une méthode d'authentification conçue spécifiquement pour les machines/services

créer l'apRole commande : 
docker compose exec vault vault write auth/approle/role/auth-service \
  token_policies="auth-service" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=0 \
  secret_id_num_uses=0

  token_policies="auth-service" : à chaque authentification réussie via cette AppRole, Vault émettra un token qui porte cette policy — donc limité aux deux permissions qu'on a définies (lire la clé JWT, générer des credentials Postgres).
token_ttl=1h / token_max_ttl=4h : durée de vie du token Vault que le service auth reçoit après authentification (différent du bail Postgres qu'on a testé plus tôt — ici c'est le token qui autorise auth à parler à Vault lui-même). auth devra renouveler ce token périodiquement, comme pour les credentials Postgres.
secret_id_ttl=0 : le secret_id (la deuxième moitié du couple d'authentification) n'expire jamais tout seul — cohérent avec le fait qu'on va le générer une fois et le stocker dans un fichier Docker secret, pas le renouveler en continu comme un credential Postgres.
secret_id_num_uses=0 : le secret_id peut être utilisé un nombre illimité de fois (pas "à usage unique") — nécessaire puisque auth va s'authentifier à chaque redémarrage du conteneur, pas juste une fois.