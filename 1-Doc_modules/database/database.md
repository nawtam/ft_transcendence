# Documentation Base de données

## Vue d'ensemble

La base de données du projet est construite en deux temps, dans deux dossiers séparés qui ne font pas la même chose :

| Dossier | Rôle | Quand ça s'exécute |
|---|---|---|
| `database/init/` | Crée les tables **vides** (la structure) | Automatiquement, une seule fois, au tout premier démarrage de Postgres |
| `database/content/` | Contient les **vraies données** (lore, PNJ, quêtes...) | Jamais tout seul  lu par `scripts/seed-content.js`, lancé à la demande via `make seed` |

Le premier construit les tiroirs (init), le second les remplit (content). Deux étapes séparées, toujours dans cet ordre : `make up` puis `make seed`.

---

## Comment fonctionne PostgreSQL, en résumé

PostgreSQL est un programme qui tourne en continu et attend une requête, et range les données en 3 niveaux : base de données → table → ligne

ex : 
- base = auth
- table = user
- ligne = 1 utilisateurs
*il peut y avoir une plusieurs lignes pour une table et plusieurs tables pour une base*

Postegres attent une requête, et l'exécute. Il peut recevoir une requete de soit auth, ia ou game.
ex : auth envoie une requete pour ajouter/supprimer un utilisateur. Postgres recois la requête et l'exécute.
game envoie une requete pour recuperer les dommage d'un monstre, postgres lui retourne.
---

## Les 4 actions de base


| Ce qu'on veut faire | Commande SQL | Exemple |
|---|---|---|
| Ajouter | `INSERT` | `INSERT INTO users (username, email) VALUES ('Marc', 'marc@mail.com');` |
| Récupérer | `SELECT` | `SELECT * FROM users;` |
| Remplacer/modifier | `UPDATE` | `UPDATE users SET email = 'nouveau@mail.com' WHERE id = 3;` |
| Supprimer | `DELETE` | `DELETE FROM users WHERE id = 3;` |

*UPDATE et DELETE sans WHERE touchent toutes les lignes d'un coup*

## créer une table
```sql
CREATE TABLE nom_de_la_table (
    nom_colonne1 TYPE contrainte,
    nom_colonne2 TYPE contrainte
);
```

**Types les plus courants :**

| Type | Sert pour |
|---|---|
| `SERIAL` | Un numéro qui s'incrémente tout seul (1, 2, 3...) — parfait pour un identifiant |
| `TEXT` | Du texte, sans limite de longueur |
| `INTEGER` | Un nombre entier |
| `TIMESTAMP` | Une date + heure |
| `BOOLEAN` | Vrai/faux |
| `JSONB` | Une structure de données flexible (stats variées, état de sauvegarde...) |
| `VECTOR(n)` | Un vecteur de nombres, utilisé par `pgvector` pour la recherche par similarité (RAG) |

**Contraintes les plus courantes :**

| Contrainte | Sert pour |
|---|---|
| `PRIMARY KEY` | Désigne la colonne qui identifie chaque ligne de façon unique |
| `NOT NULL` | Interdit qu'une ligne existe sans valeur dans cette colonne |
| `UNIQUE` | Interdit deux lignes avec la même valeur |
| `DEFAULT valeur` | Valeur automatique si rien n'est précisé |
| `REFERENCES table(colonne)` | Une **clé étrangère** : cette colonne doit pointer vers une ligne existante d'une autre table |

**Une règle non négociable** : une table qui référence une autre (`REFERENCES universes(id)`, par exemple) doit être créée **après** elle — sinon Postgres refuse avec une erreur "la table n'existe pas encore". C'est pour ça que les fichiers `init/` sont numérotés.

---


# EXEMPLE

CREATE TABLE users (
    id `SERIAL PRIMARY KEY`,
    username `TEXT UNIQUE NOT NULL`,
    email `TEXT UNIQUE NOT NULL`,
    password_hash `TEXT NOT NULL`,
    created_at `TIMESTAMP DEFAULT now`()
);