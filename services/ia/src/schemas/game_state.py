"""
CONTRACT: Game State Schemas

This module defines the data structures used for game state management, including request and response schemas for game interactions.
It defines the models for the communication between the game engine (JavaScript) and the AI (Python) components, ensuring consistent data exchange and validation.

Utility for the frontend :
- 'GameRequest' : Defines the structure of the request sent from the frontend to the backend, containing the user's message, message history, player statistics, universe context, and world state.
- 'GameResponse' : Defines the structure of the response sent from the backend to the frontend.
"""

from pydantic import BaseModel, Field
from typing import Any, Optional

class GameRequest(BaseModel):
    user_message: str
    messages_history: list[dict[str, str]] = Field(default_factory=list)
    player_stats: dict[str, Any]
    universe_context: str
    world_state: dict[str, Any]


class GameResponse(BaseModel):
    narrator_message: str
    last_tool_result: Optional[dict[str, Any]] = None
    updated_player_stats: dict[str, Any]
    updated_world_state: dict[str, Any]
    stats_updated: bool = False