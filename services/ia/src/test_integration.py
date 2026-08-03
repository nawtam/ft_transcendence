import asyncio

import asyncpg
from langchain_core.messages import HumanMessage

import src.core.config
from src.core.config import DATABASE_URL
from src.core.graph import app


async def setup_database() -> None:
    print("\n[1/3] Configuration de la base de données de test...")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL ou AI_DATABASE_URL manquante — vérifie ton .env")

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS monsters (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                hp INTEGER NOT NULL,
                max_hp INTEGER NOT NULL
            );
        """)
        await conn.execute("DELETE FROM monsters WHERE name = 'Orc'")
        await conn.execute(
            "INSERT INTO monsters (name, hp, max_hp) VALUES ('Orc', 50, 50)"
        )
        print("Table 'monsters' prête et Orc (50 HP) créé.")
    finally:
        await conn.close()


async def verify_db_results() -> int:
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        return await conn.fetchval("SELECT hp FROM monsters WHERE name = 'Orc'")
    finally:
        await conn.close()


async def run_test_scenario(user_input: str) -> dict:
    print(f"\n[2/3] L'IA analyse l'action : '{user_input}'...")

    initial_state = {
        "messages": [HumanMessage(content=user_input)],
        "player_stats": {"hp": 100, "strength": 15},
        "universe_context": "Médiéval Fantastique",
        "world_state": {"current_room": "Donjon de test"},
        "last_tool": {},
    }

    return await app.ainvoke(initial_state)


async def main() -> None:
    print(f"--- Connexion DB -> {DATABASE_URL} ---")
    await setup_database()

    user_action = "J'attaque l'Orc avec mon épée"
    final_state = await run_test_scenario(user_action)

    print("\n[3/3] Analyse du flux de messages :")
    for msg in final_state["messages"]:
        role = msg.__class__.__name__
        content = msg.content if msg.content else f"Tool Call: {msg.tool_calls}"
        print(f"   {role}: {content}")

    print(f"\nlast_tool = {final_state.get('last_tool', {})}")

    final_hp = await verify_db_results()

    print("\n" + "=" * 40)
    if final_hp < 50:
        print(f"TEST RÉUSSI : l'Orc a maintenant {final_hp} HP (dégâts confirmés en DB)")
    else:
        print("TEST ÉCHOUÉ : les HP de l'Orc n'ont pas bougé.")
    print("=" * 40 + "\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        print(f"Erreur fatale durant le test : {exc}")
