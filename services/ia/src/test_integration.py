"""
Integration tests for interpret (Referee → Tools) and narrate graphs.

Requires:
  - .env with GROQ_API_KEY (and GROQ_MODEL)

Run from repo root:
  docker compose exec ia python -m src.test_integration
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from langchain_core.messages import HumanMessage

import src.core.config  # noqa: F401 — load .env
from src.core.config import GROQ_API_KEY
from src.core.graph import interpret_graph, narrate_graph

MONSTER_NAME = "Orc"


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str = ""


@dataclass
class SuiteReport:
    checks: list[CheckResult] = field(default_factory=list)

    def add(self, name: str, ok: bool, detail: str = "") -> None:
        self.checks.append(CheckResult(name, ok, detail))
        status = "OK" if ok else "FAIL"
        suffix = f" — {detail}" if detail else ""
        print(f"  [{status}] {name}{suffix}")

    @property
    def passed(self) -> bool:
        return bool(self.checks) and all(c.ok for c in self.checks)


def _base_state(user_message: str) -> dict:
    return {
        "messages": [HumanMessage(content=user_message)],
        "narrator_message": "",
        "player_stats": {
            "hp": 100,
            "max_hp": 100,
            "location": "Donjon de test",
            "inventory": [{"name": "épée", "type": "weapon"}],
        },
        "universe_context": "Médiéval Fantastique",
        "world_state": {
            "current_room": "Donjon de test",
            "room_items": [{"name": "potion", "type": "consumable"}],
            "available_exits": ["forge"],
        },
        "last_tool": {},
    }


def _tool_was_called(state: dict, tool_name: str) -> bool:
    for msg in state.get("messages", []):
        tool_calls = getattr(msg, "tool_calls", None)
        if not tool_calls:
            continue
        for call in tool_calls:
            name = call.get("name") if isinstance(call, dict) else getattr(call, "name", None)
            if name == tool_name:
                return True
    return False


def _intent(state: dict) -> dict:
    return state.get("last_tool") or {}


async def run_interpret(user_message: str, state: dict | None = None) -> dict:
    return await interpret_graph.ainvoke(state or _base_state(user_message))


def _use_item_state(user_message: str) -> dict:
    state = _base_state(user_message)
    state["player_stats"] = {
        "hp": 50,
        "max_hp": 100,
        "location": "Donjon de test",
        "inventory": [
            {"name": "épée", "type": "weapon"},
            {"name": "potion", "type": "consumable"},
        ],
    }
    state["world_state"] = {
        "current_room": "Donjon de test",
        "room_items": [],
        "available_exits": ["forge"],
    }
    return state


async def test_combat_attack(report: SuiteReport) -> None:
    print("\n=== Scenario: interpret attack ===")
    state = await run_interpret(f"J'attaque l'{MONSTER_NAME} avec mon épée")
    tool = _intent(state)
    result = tool.get("result") or {}

    report.add(
        "attack_enemy invoked",
        _tool_was_called(state, "attack_enemy"),
    )
    report.add(
        "last_tool is attack_enemy",
        tool.get("tool_name") == "attack_enemy",
        f"got {tool.get('tool_name')}",
    )
    report.add(
        "intent action is attack",
        isinstance(result, dict) and result.get("action") == "attack",
        f"result={result}",
    )
    report.add(
        "player_stats unchanged (game owns HP)",
        (state.get("player_stats") or {}).get("hp") == 100,
        f"hp={((state.get('player_stats') or {}).get('hp'))}",
    )


async def test_clarification_path(report: SuiteReport) -> None:
    print("\n=== Scenario: unclear action ===")
    state = await run_interpret("Je regarde autour de moi")
    tool = _intent(state)
    last_msg = state["messages"][-1]
    clarification = getattr(last_msg, "content", "") or ""

    report.add(
        "attack_enemy not invoked",
        not _tool_was_called(state, "attack_enemy"),
        "look-around should not trigger combat",
    )
    report.add(
        "no gameplay intent",
        not tool.get("tool_name"),
        f"got {tool}",
    )
    report.add(
        "referee asked for clarification",
        bool(str(clarification).strip()),
        f"got {str(clarification)[:80]!r}",
    )


async def test_pickup_item(report: SuiteReport) -> None:
    print("\n=== Scenario: interpret pickup ===")
    state = await run_interpret("Je ramasse une potion")
    tool = _intent(state)
    inventory = (state.get("player_stats") or {}).get("inventory") or []

    report.add(
        "pickup_item invoked",
        _tool_was_called(state, "pickup_item"),
    )
    report.add(
        "last_tool is pickup_item",
        tool.get("tool_name") == "pickup_item",
        f"got {tool.get('tool_name')}",
    )
    report.add(
        "inventory not mutated by IA",
        len(inventory) == 1,
        f"inventory={inventory}",
    )


async def test_use_item(report: SuiteReport) -> None:
    print("\n=== Scenario: interpret use item ===")
    user_message = "J'utilise la potion"
    state = await run_interpret(user_message, _use_item_state(user_message))
    tool = _intent(state)
    stats = state.get("player_stats") or {}

    report.add(
        "use_item invoked",
        _tool_was_called(state, "use_item"),
    )
    report.add(
        "last_tool is use_item",
        tool.get("tool_name") == "use_item",
        f"got {tool.get('tool_name')}",
    )
    report.add(
        "HP not mutated by IA",
        stats.get("hp") == 50,
        f"hp={stats.get('hp')}",
    )


async def test_move_to(report: SuiteReport) -> None:
    print("\n=== Scenario: interpret move ===")
    state = await run_interpret("Je vais à la forge")
    tool = _intent(state)
    location = (state.get("player_stats") or {}).get("location")

    report.add(
        "move_to invoked",
        _tool_was_called(state, "move_to"),
    )
    report.add(
        "last_tool is move_to",
        tool.get("tool_name") == "move_to",
        f"got {tool.get('tool_name')}",
    )
    report.add(
        "location not mutated by IA",
        location == "Donjon de test",
        f"location={location}",
    )


async def test_narrate(report: SuiteReport) -> None:
    print("\n=== Scenario: narrate official game_result ===")
    state = await narrate_graph.ainvoke({
        "messages": [HumanMessage(content="J'attaque l'Orc avec mon épée")],
        "narrator_message": "",
        "player_stats": {},
        "universe_context": "Médiéval Fantastique",
        "world_state": {},
        "last_tool": {
            "result": {
                "success": True,
                "action": "attack",
                "target": "Orc",
                "damage": 12,
                "hp_left": 18,
            }
        },
    })
    text = (state.get("narrator_message") or "").strip()
    report.add(
        "narrator_message is set",
        bool(text),
        f"got {text[:80]!r}",
    )


async def main() -> int:
    if not GROQ_API_KEY:
        print("FATAL: GROQ_API_KEY missing")
        return 1

    report = SuiteReport()
    await test_combat_attack(report)
    await test_clarification_path(report)
    await test_pickup_item(report)
    await test_use_item(report)
    await test_move_to(report)
    await test_narrate(report)

    print("\n" + "=" * 44)
    ok = sum(1 for c in report.checks if c.ok)
    total = len(report.checks)
    if report.passed:
        print(f"ALL CHECKS PASSED ({ok}/{total})")
        print("=" * 44)
        return 0

    print(f"SOME CHECKS FAILED ({ok}/{total})")
    for c in report.checks:
        if not c.ok:
            print(f"  - {c.name}: {c.detail}")
    print("=" * 44)
    return 1


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except KeyboardInterrupt:
        print("\nInterrupted.")
        raise SystemExit(130)
    except Exception as exc:
        print(f"FATAL: {exc}")
        raise SystemExit(1) from exc
