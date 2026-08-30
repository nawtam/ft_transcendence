"""
Integration test for the IA game graph (Referee → Tools → Narrator → Weaver).

Requires:
  - .env with DATABASE_URL / AI_DATABASE_URL and GROQ_API_KEY
  - Postgres reachable (e.g. docker compose up postgres ia)

Run from repo root:
  docker compose exec ia python -m src.test_integration
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from langchain_core.messages import HumanMessage

import src.core.config  # noqa: F401 — load .env
from src.core.config import DATABASE_URL
from src.core.graph import game_graph
from src.memory.database import close_pool, get_pool, init_pool

MONSTER_NAME = "Orc"
MONSTER_START_HP = 50


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
        },
        "last_tool": {},
    }


def _tool_was_called(state: dict, tool_name: str) -> bool:
    """Scan message history — last_tool alone is unreliable (Weaver runs last)."""
    for msg in state.get("messages", []):
        tool_calls = getattr(msg, "tool_calls", None)
        if not tool_calls:
            continue
        for call in tool_calls:
            name = call.get("name") if isinstance(call, dict) else getattr(call, "name", None)
            if name == tool_name:
                return True
    return False


def _narrator_ok(state: dict) -> tuple[bool, str]:
    text = (state.get("narrator_message") or "").strip()
    ok = bool(text) and text != "NO_CHANGE"
    preview = f"{text[:80]}..." if len(text) > 80 else text
    return ok, preview


async def seed_monster() -> None:
    async with get_pool().acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS monsters (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                hp INTEGER NOT NULL,
                max_hp INTEGER NOT NULL
            );
        """)
        await conn.execute("DELETE FROM monsters WHERE name = $1", MONSTER_NAME)
        await conn.execute(
            "INSERT INTO monsters (name, hp, max_hp) VALUES ($1, $2, $2)",
            MONSTER_NAME,
            MONSTER_START_HP,
        )


async def read_monster_hp() -> int | None:
    async with get_pool().acquire() as conn:
        return await conn.fetchval(
            "SELECT hp FROM monsters WHERE name = $1",
            MONSTER_NAME,
        )


async def run_graph(user_message: str, state: dict | None = None) -> dict:
    return await game_graph.ainvoke(state or _base_state(user_message))


def _use_item_state(user_message: str) -> dict:
    """Potion already in inventory + low HP so healing is visible."""
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
    # No potion on the floor — it is already in the bag.
    state["world_state"] = {
        "current_room": "Donjon de test",
        "room_items": [],
    }
    return state


async def test_combat_attack(report: SuiteReport) -> None:
    print("\n=== Scenario: attack monster ===")
    await seed_monster()

    state = await run_graph(f"J'attaque l'{MONSTER_NAME} avec mon épée")
    narrator_ok, narrator_preview = _narrator_ok(state)
    hp_after = await read_monster_hp()

    report.add(
        "attack_enemy invoked in graph",
        _tool_was_called(state, "attack_enemy"),
        "checked messages, not last_tool",
    )
    report.add(
        "narrator_message is set",
        narrator_ok,
        f"got {narrator_preview!r}",
    )
    report.add(
        "monster still exists in DB",
        hp_after is not None,
        f"hp={hp_after}",
    )

    if hp_after == MONSTER_START_HP:
        report.add(
            "HP unchanged (critical miss accepted)",
            True,
            f"hp={hp_after}",
        )
    elif isinstance(hp_after, int) and 0 <= hp_after < MONSTER_START_HP:
        report.add(
            "successful hit lowered HP",
            True,
            f"hp {MONSTER_START_HP} → {hp_after}",
        )
    else:
        report.add(
            "combat outcome plausible",
            False,
            f"unexpected hp={hp_after}",
        )


async def test_clarification_path(report: SuiteReport) -> None:
    print("\n=== Scenario: unclear action (no combat) ===")
    await seed_monster()
    hp_before = await read_monster_hp()

    state = await run_graph("Je regarde autour de moi")
    narrator_ok, narrator_preview = _narrator_ok(state)
    hp_after = await read_monster_hp()

    report.add(
        "attack_enemy not invoked",
        not _tool_was_called(state, "attack_enemy"),
        "look-around should not trigger combat",
    )
    report.add(
        "narrator_message is set",
        narrator_ok,
        f"got {narrator_preview!r}",
    )
    report.add(
        "monster HP unchanged",
        hp_after == hp_before == MONSTER_START_HP,
        f"{hp_before} → {hp_after}",
    )


async def test_pickup_item(report: SuiteReport) -> None:
    print("\n=== Scenario: pick up item ===")

    state = await run_graph("Je ramasse une potion")
    inventory = (state.get("player_stats") or {}).get("inventory") or []
    room_items = (state.get("world_state") or {}).get("room_items") or []

    report.add(
        "pickup_item invoked in graph",
        _tool_was_called(state, "pickup_item"),
        "checked messages, not last_tool",
    )
    report.add(
        "potion added to inventory",
        any("potion" in (item.get("name") or "").lower() for item in inventory),
        f"inventory={inventory}",
    )
    report.add(
        "inventory has at least two items",
        len(inventory) >= 2,
        f"count={len(inventory)}",
    )
    report.add(
        "potion removed from room_items",
        not any("potion" in (item.get("name") or "").lower() for item in room_items),
        f"room_items={room_items}",
    )


async def test_use_item(report: SuiteReport) -> None:
    print("\n=== Scenario: use item ===")

    user_message = "J'utilise la potion"
    state = await run_graph(user_message, _use_item_state(user_message))
    stats = state.get("player_stats") or {}
    inventory = stats.get("inventory") or []
    hp = stats.get("hp")

    report.add(
        "use_item invoked in graph",
        _tool_was_called(state, "use_item"),
        "checked messages, not last_tool",
    )
    report.add(
        "potion removed from inventory",
        not any("potion" in (item.get("name") or "").lower() for item in inventory),
        f"inventory={inventory}",
    )
    report.add(
        "HP increased after consumable",
        isinstance(hp, int) and hp > 50,
        f"hp={hp} (started at 50)",
    )
    report.add(
        "sword still in inventory",
        any("épée" in (item.get("name") or "").lower() for item in inventory),
        f"inventory={inventory}",
    )


async def main() -> int:
    print(f"DB -> {DATABASE_URL}")
    if not DATABASE_URL:
        print("FATAL: DATABASE_URL / AI_DATABASE_URL missing")
        return 1

    report = SuiteReport()
    await init_pool()
    try:
        await test_combat_attack(report)
        await test_clarification_path(report)
        await test_pickup_item(report)
        await test_use_item(report)
    finally:
        await close_pool()

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
