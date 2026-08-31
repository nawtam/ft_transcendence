from langchain_core.tools import tool
import json


@tool
async def move_to(destination: str) -> str:
    """
    Records the player's intent to move to another location.
    Args:
        destination: Technical id of the target room or exit
            (e.g. 'forge', 'forest_black'). Not a full sentence.
    Requirements:
        Only use if the user clearly wants to go somewhere.
        Do not guess the destination.
        Do not check if the exit exists — the game engine validates that.
    """
    if not destination.strip():
        return json.dumps({
            "success": False,
            "error": "Destination is required.",
        })

    return json.dumps({
        "success": True,
        "action": "move",
        "destination": destination.strip(),
    })
