# Les microservices dans Transcendence

## 1. C'est quoi, un microservice ?

Définition de référence (Martin Fowler & James Lewis, 2014) : un petit service autonome, dans son propre processus, qui communique via des mécanismes légers (souvent HTTP/REST), construit autour d'une capacité métier précise, déployable indépendamment.

---

## 2. Les services

Le projet est decoupé en 3 services : auth, game et ia.

## 3. La communication interservices

Si chaque action de jeu devait faire un aller-retour réseau vers `auth-service` pour vérifier un token, on ajouterait de la latence sur chaque message WebSocket

JSON Web Token : Un pass numérique signé une fois par le service et qui permet une connexion illimité
**un JWT est auto-suffisant.**

Ici, on va plus loin qu'une simple clé partagée (HS256) : on utilise du **RS256 asymétrique**.

- `auth-service` détient la **clé privée** → lui seul peut *signer* un token
- `game-service` ne détient que la **clé publique** → il peut *vérifier* qu'un token est authentique, mais ne pourrait jamais en forger un valide même si son code était compromis
- Les deux clés vivent dans **Vault**, à deux chemins distincts  chacun protégé par sa propre policy

même si `game-service` était compromis, l'attaquant ne pourrait pas émettre de faux tokens.


| Service | Rôle | Techno | Exposé publiquement |
|---|---|---|---|
| `gateway` | Reverse-proxy + sert le frontend (SPA) | Nginx | Oui (port 8443) |
| `auth-service` | Inscription, login, émission du JWT | Node.js | Non (via gateway) |
| `game-service` | État de jeu, WebSocket temps réel | Node.js | Non (via gateway) |
| `ai-service` | LLM + RAG (le Maître du Jeu virtuel) | Python/FastAPI | Non, jamais |
| `postgres` | Persistance | PostgreSQL + pgvector | Non |
| `vault` | Secrets + clés JWT | HashiCorp Vault | Non |



PostgreSQL (souvent appelé "Postgres") est un système de gestion de base de données relationnelle (SGBD). C'est l'un des outils les plus robustes et utilisés au monde.
Le joueur se connecte sur PostgreSQL, le backend lui donne un JWT pour qu'il puisse naviguer, et le backend utilise Vault en arrière-plan pour récupérer discrètement les clés d'API nécessaires pour faire tourner le site et l'IA.


--- 

```mermaid
graph TD
    Client[Client - navigateur] -->|HTTPS :8443| Gateway[gateway - Nginx]
    Gateway -->|/api/auth| Auth[auth-service - Node.js]
    Gateway -->|/api/game, /ws| Game[game-service - Node.js]
    Game -->|HTTP interne :8000| AI[ai-service - Python]
    Auth --> DBAuth[(PostgreSQL - jdr_auth)]
    Game --> DBGame[(PostgreSQL - jdr_game)]
    AI --> DBAI[(PostgreSQL - jdr_ai + pgvector)]
    Auth -->|clé privée| Vault[Vault]
    Game -->|clé publique| Vault
```


---
