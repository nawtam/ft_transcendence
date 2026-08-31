"""
CONTRACT: Game State Schemas

This module defines the data structures used for game state management, including request and response schemas for game interactions.
It defines the models for the communication between the game engine (JavaScript) and the AI (Python) components, ensuring consistent data exchange and validation.

Utility:
- InterpretRequest / InterpretResponse : POST /interpret
- NarrateRequest / NarrateResponse : POST /narrate
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
