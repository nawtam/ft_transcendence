from src.tools.combat import attack_enemy
from src.tools.world import record_world_event
from src.tools.inventory import pickup_item, use_item


REFEREE_TOOLS = [attack_enemy, pickup_item]
WEAVER_TOOLS = [record_world_event]
ALL_TOOLS = REFEREE_TOOLS + WEAVER_TOOLS


__all__ = [
    "REFEREE_TOOLS",
    "WEAVER_TOOLS",
    "ALL_TOOLS",
    "attack_enemy",
    "record_world_event",    
]
