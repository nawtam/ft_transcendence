# Les 4 containerfiles

## Les services
**`FROM docker.io/node:20-alpine`**
- node:20 : version moderne pour ecrire en js
- alpine : variante legere de linux => moins de failles

**`COPY package*.json ./`**
Copie les fichiers package.json et package-lock.json de l'ordinateur vers le container.
Pourquoi ?

**`RUN npm ci`**
- npm :
- ci : réinstalle tout depuis zéro en respectant exactement les versions écrites dans package-lock.json

**`COPY src ./src`**
copie dossier src de l'ordi -> container


**service game et auth :**

**`CMD ["node", "src/index.js"]`**
node : formule d'excution d'un programme 
on lui demande d'exécuter index.js

**service ia :**

**`CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]`**
Lance le programme uvicorn, donne l'application FastAPI (celle qui est écrite dans main.py, rangée dans le dossier src/, sous le nom de variable app), et fais-la écouter sur toutes les entrées réseau possibles, sur le port 8000

---
## gateway

On va créer 2 images : 
la première : sert à construire le site (transformer le TypeScript en HTML/CSS/JS) on a besoin de node.js
La deuxième : servir le site une fois construit (besoin de Nginx) pas besoin de node.js
Si on avais qu'une image elle contieent node en permanence et donc alourdis le container

**IMAGE 1 :**

**`FROM docker.io/node:20-alpine AS frontend-build`**

AS frontend-build : donne un nom à cette étape, pour pouvoir y faire référence plus tard pour la supprimer par la suite car on a pas besoin de node


**`RUN npm run build`**
npm run build exécute vite build, qui range toujours son résultat dans un dossier appelé dist/ c'est son comportement par défaut
dans dist/ il y aura des fichier statique prêt a etre utiliser (HTML/CSS/JS)

*Vite est un outil qui transforme votre code frontend (écrit en TypeScript moderne, avec import/export, potentiellement éparpillé dans plusieurs fichiers) en quelque chose qu'un navigateur peut comprendre directement*

**IMAGE 2 :**

**`COPY --from=frontend-build /dist /usr/share/nginx/html`**

On va chercher uniquement le dossier dist/ fabriqué dans la première étape (même si cette étape n'existe plus dans l'image finale), et on le dépose là où Nginx sert ses fichiers statiques.



# Podman compose
 C'est ce qui permet à plusieurs petits services séparés de démarrer ensemble, dans le bon ordre

**`networks:`** Déclare un réseau virtuel isolé, nommé `jdr-network.`
**`driver: bridge :`** le type de réseau standard

### bloc Gateway
**`build:`** construie l'image a partir d'un **containerfile**, **`context: . `** est le point de départ des copy la cest un point donc la ou se trouve podmancompose.yml cest necessaire pour que le container gateway puisse copier à la fois le front et gateway.

**`ports: - "2026:443"`** : 2026 port de l'ordi, 443 port de dans lequel nginx ecoute
**`networks: - jdr-network`** : Branche ce container sur le réseau qu'on a déclaré plus haut

**`depends_on:`** démarre auth et game avant gateway

**`restart: unless-stopped`** : Si le container plante relance automatique

### bloc auth/ia/game
même principe que gateway au debut
**`context: ./services/...`**  le point de départ pour les COPY du containerfile

**`DATABASE_URL`** necessaire pour ce connecté a la base de donnée 

**`JWT_SECRET: ${JWT_SECRET}`** Le secret utilisé pour signer les jetons de connexion


## Postgres
*logiciel qui range et retrouve les données*

**`Image`** pas buld donc on telecharge une image existante

**`environnement`** on creer un compte admin au premier demarrage 

**`volumes`** localisation du volume pour la persistance
make up
podman-compose lit le fichier du début à la fin, et pour chaque service listé sous services: :

1- Il construit l'image (build:) ou télécharge celle demandée (image:), si ce n'est pas déjà fait.

2- Il crée le réseau (jdr-network) et les volumes (pgdata), s'ils n'existent pas encore.

3- Il démarre chaque container, en respectant l'ordre donné par depends_on:, en lui injectant exactement les variables d'environnement, les volumes et le réseau qu'on a décrits.


