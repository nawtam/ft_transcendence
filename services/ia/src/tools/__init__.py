from src.tools.combat import attack_enemy
from src.tools.world import record_world_event

REFEREE_TOOLS = [attack_enemy]
WEAVER_TOOLS = [record_world_event]
ALL_TOOLS = REFEREE_TOOLS + WEAVER_TOOLS


__all__ = [
    "REFEREE_TOOLS",
    "WEAVER_TOOLS",
    "ALL_TOOLS",
    "attack_enemy",
    "record_world_event",    
]
