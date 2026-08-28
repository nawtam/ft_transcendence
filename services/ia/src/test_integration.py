"""
Integration test for the IA game graph (Referee → Tools → Narrator → Weaver).

Requires:
  - .env with DATABASE_URL / AI_DATABASE_URL and GROQ_API_KEY
  - Postgres reachable (e.g. docker compose up postgres)

Run from services/ia:
  python -m src.test_integration
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
        "world_state": {"current_room": "Donjon de test"},
        "last_tool": {},
    }


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


async def run_graph(user_message: str) -> dict:
    return await game_graph.ainvoke(_base_state(user_message))


async def test_combat_attack(report: SuiteReport) -> None:
    print("\n=== Scenario: attack monster ===")
    await seed_monster()

    state = await run_graph(f"J'attaque l'{MONSTER_NAME} avec mon épée")
    last_tool = state.get("last_tool") or {}
    tool_name = last_tool.get("tool_name")
    result = last_tool.get("result") or {}
    narrator = (state.get("narrator_message") or "").strip()
    hp_after = await read_monster_hp()

    report.add(
        "attack_enemy was called",
        tool_name == "attack_enemy",
        f"got tool_name={tool_name!r}",
    )
    report.add(
        "narrator_message is set (not Weaver leftover)",
        bool(narrator) and narrator != "NO_CHANGE",
        f"got {narrator[:80]!r}..." if len(narrator) > 80 else f"got {narrator!r}",
    )
    report.add(
        "monster still exists in DB",
        hp_after is not None,
        f"hp={hp_after}",
    )

    if not isinstance(result, dict):
        report.add("tool result is a dict", False, f"got {type(result).__name__}")
        return

    if result.get("reason") == "critical_miss":
        report.add(
            "critical miss keeps HP unchanged",
            hp_after == MONSTER_START_HP,
            f"hp={hp_after}",
        )
        return

    if result.get("success") is True:
        expected_hp = result.get("hp_left")
        report.add(
            "successful hit lowers HP",
            isinstance(hp_after, int) and hp_after < MONSTER_START_HP,
            f"hp {MONSTER_START_HP} → {hp_after}",
        )
        report.add(
            "DB HP matches tool hp_left",
            hp_after == expected_hp,
            f"db={hp_after} tool={expected_hp}",
        )
        return

    report.add(
        "tool returned a usable combat outcome",
        False,
        f"result={result}",
    )


async def test_clarification_path(report: SuiteReport) -> None:
    print("\n=== Scenario: unclear action (no combat tool) ===")
    await seed_monster()
    hp_before = await read_monster_hp()

    state = await run_graph("Je regarde autour de moi")
    last_tool = state.get("last_tool") or {}
    narrator = (state.get("narrator_message") or "").strip()
    hp_after = await read_monster_hp()

    report.add(
        "no combat tool on look-around",
        last_tool.get("tool_name") != "attack_enemy",
        f"last_tool={last_tool.get('tool_name')!r}",
    )
    report.add(
        "narrator still answers",
        bool(narrator) and narrator != "NO_CHANGE",
        f"got {narrator[:80]!r}..." if len(narrator) > 80 else f"got {narrator!r}",
    )
    report.add(
        "monster HP unchanged",
        hp_after == hp_before,
        f"{hp_before} → {hp_after}",
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
