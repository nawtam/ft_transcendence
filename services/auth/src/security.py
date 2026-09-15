# src/security.py
"""Pour l'instant : uniquement le stockage des clés JWT chargées depuis Vault
au démarrage. Le hashing Argon2 et l'encodage/décodage JWT arriveront avec
l'étape 4 (endpoints), qui en a besoin directement.
"""

_private_key: str | None = None
_public_key: str | None = None


def configure_keys(private_key_pem: str, public_key_pem: str) -> None:
    """Appelé une seule fois au démarrage (lifespan de main.py)."""
    global _private_key, _public_key
    _private_key = private_key_pem
    _public_key = public_key_pem


def get_private_key() -> str:
    if _private_key is None:
        raise RuntimeError("security.configure_keys() n'a pas été appelé au démarrage")
    return _private_key


def get_public_key() -> str:
    if _public_key is None:
        raise RuntimeError("security.configure_keys() n'a pas été appelé au démarrage")
    return _public_key