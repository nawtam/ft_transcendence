pyproject.toml : c'est le manifeste uv, il déclare les dépendances (fastapi, uvicorn, sqlalchemy, psycopg, passlib avec le backend argon2-cffi, PyJWT pour le RS256, hvac comme client Vault officiel)
uv.lock : est généré automatiquement par uv lock et fige les versions exacte
.dockerignore : évite d'envoyer secrets/, .venv/, __pycache__ dans le contexte de build.

services/auth/
├── containerfile               
├── pyproject.toml              # géré par uv
├── uv.lock                     # généré par uv, committé
├── .dockerignore                
├── secrets/
│   └── vault_secret_id.txt    
├── tests/                      # squelette vide pour l'instant
│   └── __init__.py
└── src/
    ├── __init__.py
    ├── main.py                 # app FastAPI + lifespan (startup/shutdown)
    ├── config.py                # Settings (pydantic-settings)
    ├── security.py              # Argon2, JWT RS256, cookies httpOnly
    ├── dependencies.py          # get_db, get_current_user
    ├── vault_client.py          # AppRole, lecture JWT, credentials DB + tâche de fond
    ├── db/
    │   ├── __init__.py
    │   ├── base.py               # declarative Base
    │   ├── session.py            # engine courant + sessionmaker (mutable)
    │   └── models.py             # User, RefreshToken
    ├── schemas/
    │   ├── __init__.py
    │   └── auth.py                # RegisterIn, LoginIn, UserOut...
    └── routers/
        ├── __init__.py
        └── auth.py                 # les 5 endpoints, logique incluse