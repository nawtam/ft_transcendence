import os
from pathlib import Path
from dotenv import find_dotenv, load_dotenv

_current_file = Path(__file__).resolve()

_IA_SERVICE_ROOT = _current_file.parents[2]

try:
    _MONOREPO_ROOT = _current_file.parents[4]
except IndexError:
    _MONOREPO_ROOT = _IA_SERVICE_ROOT

def _load_env() -> None:
    for candidate in (_MONOREPO_ROOT / ".env", _IA_SERVICE_ROOT / ".env"):
        if candidate.is_file():
            load_dotenv(candidate, override=False)
            return

    path = find_dotenv()
    if path:
        load_dotenv(path, override=False)

_load_env()

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("AI_DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")