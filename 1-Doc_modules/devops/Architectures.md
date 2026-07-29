# Rôle de chaque fichier et dossier

## Fichiers à la racine

- **`.env.example`** → modèle de configuration avec des valeurs bidon. Contiendra : les mots de passe des 3 bases, le `JWT_SECRET` partagé, et les URLs de connexion utilisées par le script de remplissage.
- **`.gitignore`** → liste de ce qu'on interdit d'envoyer sur Git. Contient : `.env`, les certificats, `node_modules/`, `__pycache__/`.
- **`Makefile`** → raccourcis de commandes. Contient : `up`, `down`, `re`, `logs`, `ps`, `clean`, `seed`.
- **`README.md`** → notice d'installation humaine. Contient : les étapes pour démarrer, la liste des services.
- **`podman-compose.yml`** → le plan d'assemblage de tout le système. Contient : les 5 blocs (gateway, auth, game, ia, postgres), le réseau, le volume.

## `database/`

- **`init/`** → des fichiers `.sql` numérotés, exécutés dans l'ordre 
- **`content/universes/`** → le vrai contenu de vos univers de jeu (lore, PNJ, quêtes, monstres...), écrit en JSON/Markdown, un dossier par univers.

## `frontend/`

- **`package.json`** → liste des outils du frontend (`vite`, `typescript`).
- **`tsconfig.json`** → réglages du compilateur TypeScript.
- **`index.html`** → la seule vraie page HTML, point d'entrée du navigateur.
- **`src/main.ts`** → le tout premier fichier exécuté, lance l'affichage de la page actuelle.
- **`src/router.ts`** → décide quelle page afficher selon l'adresse visitée.
- **`src/pages/home.ts`** → le contenu d'une page précise (ici, l'accueil). Vous en ajouterez d'autres au même endroit au fur et à mesure (`login.ts`, `game.ts`...).

## `gateway/`

- **`containerfile`** → recette en 2 étapes : construit le frontend, puis le sert avec Nginx.
- **`nginx.conf`** → dit où rediriger chaque type de demande (`/api/auth/` → auth, `/api/game/` → game, `/ws/` → game, tout le reste → le site statique).
- **`certs/`** → dossier vide dans le repo, destiné à recevoir vos 2 fichiers de certificat générés localement (jamais committés).

## `services/auth/`

- **`containerfile`** → recette pour fabriquer l'image de ce service.
- **`package.json`** → outils : `express`, `bcrypt`, `jsonwebtoken`, `pg`.
- **`src/index.js`** → le code : inscription, connexion, émission du jeton (signé avec `JWT_SECRET`).

*(Pas de `vaultClient.js` ici, contrairement à l'ancienne version — plus besoin, puisqu'on lit directement `process.env.JWT_SECRET`.)*

## `services/game/`

- **`containerfile`** → même principe que `auth`.
- **`package.json`** → outils : `express`, `ws`, `axios`, `jsonwebtoken`, `pg`.
- **`src/index.js`** → le code : vérifie le jeton (même `JWT_SECRET` qu'`auth`), gère le WebSocket, appelle `ia` quand il faut de la narration.

*(Pas de `vaultClient.js` ni de `middlewares/verifyJwt.js` séparé — la vérification est directement dans `index.js`, en une petite fonction, pour rester simple.)*

## `services/ia/`

- **`containerfile`** → recette basée sur Python.
- **`requirements.txt`** → outils : `fastapi`, `uvicorn`, `pydantic`.
- **`app/__init__.py`** → fichier vide, dit à Python que ce dossier est un module.
- **`app/main.py`** → le code : reçoit une demande, renvoie du texte généré (pour l'instant, une phrase fixe en attendant un vrai LLM).


## `scripts/`

- **`package.json`** → outils : juste `pg`.
- **`seed-content.js`** → lit tout `database/content/` et remplit les vraies tables avec, lancé via `make seed`.