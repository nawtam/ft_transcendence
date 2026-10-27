"""
CONTRACT: Game <-> IA (internal HTTP, game service only)

Flow per player message:
  1. POST /interpret  → intent OR clarification
  2. If clarification → send text to player, STOP
  3. Game applies rules from intent.result.action -> updates db_game
  4. POST /narrate with game_result (official mechanical outcome)
  5. Send narrator_message to player

Intent shape (InterpretResponse.intent):
  { "tool_name": "...", "args": {...}, "result": { "success": true, "action": "...", ... } }

Actions game must handle (intent.result.action):
  attack   -> combat, HP enemies/player
  picked_up -> inventory + room_items
  used     -> consumable effects
  move     -> location + reload room
  examine  -> flavor_only, no DB required (describe room)

IA never mutates gameplay state — game persists everything.
"""

from pydantic import BaseModel, Field
from typing import Any, Optional


class InventoryItem(BaseModel):
    name: str
    type: str

class PlayerStats(BaseModel):
    hp: int
    max_hp: int
    location: str = "unknown"
    inventory: list[InventoryItem] = Field(default_factory=list)

class WorldState(BaseModel):
    current_room: str = "unknown"
    room_items: list[InventoryItem] = Field(default_factory=list)
    available_exits: list[str] = Field(default_factory=list)

class InterpretRequest(BaseModel):
    user_message: str
    messages_history: list[dict[str, str]] = Field(default_factory=list)
    player_stats: PlayerStats
    universe_context: str
    world_state: WorldState
    world_flags: list[str] = Field(default_factory=list)
    recent_events: list[dict[str, Any]] = Field(default_factory=list)

class InterpretResponse(BaseModel):
    intent: Optional[dict] = None
    clarification: Optional[str] = None

class NarrateRequest(BaseModel):
    user_message: str
    messages_history: list[dict[str, str]] = Field(default_factory=list)
    universe_context: str
    game_result: dict[str, Any]

class NarrateResponse(BaseModel):
    narrator_message: str
