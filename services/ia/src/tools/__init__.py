from src.tools.combat import attack_enemy
from src.tools.world import move_to, examine
from src.tools.inventory import pickup_item, use_item


REFEREE_TOOLS = [attack_enemy, pickup_item, use_item, move_to, examine]
ALL_TOOLS = REFEREE_TOOLS


__all__ = [
    "REFEREE_TOOLS",
    "ALL_TOOLS",
    "attack_enemy",
    "move_to",
    "examine",
]
