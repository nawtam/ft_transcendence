from typing import Any, TypedDict


class AttackResult(TypedDict, total=False):
    success: bool
    damage: int
    target: str
    hp_left: int
    weapon: str
    hit_roll: int
    is_dead: bool
    reason: str
    error: str


class LastToolState(TypedDict, total=False):
    tool_name: str
    args: dict[str, Any]
    result: dict[str, Any] | str | None
    error: str | None
