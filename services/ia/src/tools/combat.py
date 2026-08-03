import json
import random

import asyncpg
from langchain_core.tools import tool

from src.core.config import DATABASE_URL


async def get_db_connection() -> asyncpg.Connection:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL ou AI_DATABASE_URL manquante — vérifie ton .env")
    return await asyncpg.connect(DATABASE_URL)


@tool
async def attack_enemy(target: str, weapon: str) -> str:
    """
    Executes a physical attack sequence against a named monster.

    Args:
        target: The exact name of the monster to attack (e.g., 'Orc').
        weapon: The weapon used for the attack.

    Requirements:
        Only use this tool if the user's intent is clearly offensive.
        If the target is not provided, do not guess; ask for clarification.
    """
    conn = await get_db_connection()

    try:
        monster = await conn.fetchrow(
            "SELECT id, hp, max_hp FROM monsters WHERE name = $1",
            target,
        )

        if not monster:
            result = {
                "success": False,
                "error": f"Target '{target}' not found in the database.",
                "target": target,
                "weapon": weapon,
            }
            return json.dumps(result)

        hit_roll = random.randint(1, 20)
        if hit_roll == 1:
            result = {
                "success": False,
                "reason": "critical_miss",
                "target": target,
                "weapon": weapon,
                "hit_roll": hit_roll,
            }
            return json.dumps(result)

        damage = random.randint(5, 12)
        new_hp = max(0, monster["hp"] - damage)

        await conn.execute(
            "UPDATE monsters SET hp = $1 WHERE id = $2",
            new_hp,
            monster["id"],
        )

        result = {
            "success": True,
            "damage": damage,
            "target": target,
            "hp_left": new_hp,
            "weapon": weapon,
            "hit_roll": hit_roll,
            "is_dead": new_hp <= 0,
        }
        return json.dumps(result)

    except Exception as exc:
        result = {
            "success": False,
            "error": f"Technical error during combat: {exc}",
            "target": target,
            "weapon": weapon,
        }
        return json.dumps(result)

    finally:
        await conn.close()
