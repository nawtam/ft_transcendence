import json

from langchain_core.tools import tool


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

    if not target.strip():
        return json.dumps({
            "success": False,
            "error": "Target name is required.",
        })

    if not weapon.strip():
        return json.dumps({
            "success": False,
            "error": "Weapon name is required.",
        })

    return json.dumps({
        "success": True,
        "action": "attack",
        "target": target.strip(),
        "weapon": weapon.strip(),
    })