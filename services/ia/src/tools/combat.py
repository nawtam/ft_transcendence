import json
import random

from langchain_core.tools import tool
from src.memory.database import get_pool



@tool
async def attack_enemy(target: str, weapon: str) -> str:
    """
    Executes a physical attack sequence against a named target.

    Args:
        target: The exact name of the target to attack (e.g., 'Orc').
        weapon: The weapon used for the attack.

    Requirements:
        Only use this tool if the user's intent is clearly offensive.
        If the target is not provided, do not guess; ask for clarification.
    """

    try:
        async with get_pool().acquire() as conn:
            enemy = await conn.fetchrow(
                "SELECT id, hp, max_hp FROM monsters WHERE name = $1",
                target,
            )

            if not enemy:
                return json.dumps(
                    {
                        "success": False,
                        "error": f"target '{target}' not found in the database.",
                        "target": target,
                        "weapon": weapon,
                })

            hit_roll = random.randint(1, 20)
            if hit_roll == 1:
                return json.dumps({
                    "success": False,
                    "reason": "critical_miss",
                    "target": target,
                    "weapon": weapon,
                    "hit_roll": hit_roll, 
                })

            damage = random.randint(5, 12)
            new_hp = max(0, enemy["hp"] - damage)

            await conn.execute(
                "UPDATE monsters SET hp = $1 WHERE id = $2",
                new_hp,
                enemy["id"],
            )

            return json.dumps({
                "success": True,
                "damage": damage,
                "target": target,
                "hp_left": new_hp,
                "weapon": weapon,
                "hit_roll": hit_roll,
                "is_dead": new_hp <= 0,
            })

    except Exception as exc:
        return json.dumps({
            "success": False,
            "error": f"Technical error during combat: {exc}",
            "target": target,
            "weapon": weapon,
        })
