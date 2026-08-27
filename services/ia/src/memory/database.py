import asyncpg
from src.core.config import DATABASE_URL

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    """To be called at FastAPI app startup."""
    global _pool
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL or AI_DATABASE_URL missing — check your .env file")
   
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)


async def close_pool() -> None:
    """To be called at FastAPI app startup."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized — call init_pool() at startup")
    return _pool