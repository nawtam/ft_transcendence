import asyncpg

from src.core.config import DATABASE_URL
from src.tools.combat import get_db_connection

__all__ = ["DATABASE_URL", "get_db_connection", "get_connection"]


async def get_connection() -> asyncpg.Connection:
    return await get_db_connection()
