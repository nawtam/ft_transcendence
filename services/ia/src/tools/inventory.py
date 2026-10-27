import json
from langchain_core.tools import tool



@tool
async def pickup_item(item_name: str, item_type: str) -> str:
    """
    Records the player's intent to pick up an item.

    Args:
        item_name: Name of the item (e.g. 'potion').
        item_type: One of: weapon, consumable, key.

    Requirements:
        Only use if the user clearly wants to pick something up.
        Do not guess the item name.
    """
    if not item_name.strip():
        return json.dumps({
            "success": False,
            "error": "Item name is required.",
        })

    return json.dumps({
        "success": True,
        "action": "picked_up",
        "item": {"name": item_name.strip(), "type": item_type},
    })

@tool
async def use_item(item_name: str) -> str:
    """
    Records the player's intent to use an item from inventory.

    Args:
        item_name: Name of the item to use (e.g. 'potion').

    Requirements:
        Only use if the user clearly wants to use an item.
        Do not guess the item name.
    """
    if not item_name.strip():
        return json.dumps({
            "success": False,
            "error": "Item name is required.",
        })

    return json.dumps({
        "success": True,
        "action": "used",
        "item_name": item_name.strip(),
    })
