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
        Use a named item from inventory.

        args:
            -item_name: the name of the item to use.

        Requirements:
            Only use this tool if the user's itent is clearly to use an item.
            If the item is not provided, do not guess; ask for clarification.
    """

    try:
        async with get_pool().acquire() as conn:
            item = await conn.fetchrow(
                "SELECT name FROM items WHERE name =$1",
                item_name,
            )
        
        if not item:
            return json.dumps(
            {
                "success": False,
                "error": f"item '{item_name}' not found in the database.",
                "name": item_name,
                "type": item_type,
            })
        
        return json.dumps({
            "success": True,
            "item": {"name": item_name},
            "action": "used",
        })

    except Exception as exc:
        return json.dumps({
            "success": False,
            "error": f"Technical error during the use of an item: {exc}",
            "name": item_name,
        })
