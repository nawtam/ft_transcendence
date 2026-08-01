import asyncio
import os
import random
import asyncpg
from dotenv import load_dotenv, find_dotenv

# Importation de ton travail
from src.core.graph import app
from src.core.state import State

# Charger les variables d'environnement (API Groq, DB_URL)
load_dotenv(find_dotenv())

async def setup_database():
    """
    Prépare la base de données pour le test.
    Crée un Orc avec 50 HP pour s'assurer que le test est répétable.
    """
    print("\n[1/3] 🛠️  Configuration de la base de données de test...")
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    try:
        # Nettoyage et création du monstre de test
        await conn.execute("DELETE FROM monsters WHERE name = 'Orc'")
        await conn.execute("INSERT INTO monsters (name, hp, max_hp) VALUES ('Orc', 50, 50)")
        print("✅ Monstre 'Orc' (50 HP) prêt dans la base de données.")
    finally:
        await conn.close()

async def verify_db_results():
    """
    Vérifie si les HP de l'Orc ont bien diminué.
    """
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    try:
        hp = await conn.fetchval("SELECT hp FROM monsters WHERE name = 'Orc'")
        return hp
    finally:
        await conn.close()

async def run_test_scenario(user_input: str):
    """
    Lance un tour de jeu complet à travers le graphe LangGraph.
    """
    print(f"\n[2/3] 🧠 L'IA analyse l'action : '{user_input}'...")
    
    # État initial tel que défini dans ton state.py
    initial_state = {
        "messages": [("user", user_input)],
        "player_stats": {"hp": 100, "strength": 15},
        "universe_context": "Médiéval Fantastique",
        "world_state": {"current_room": "Donjon de test"},
        "last_tool": {}
    }

    # EXÉCUTION DU GRAPHE (La boucle Arbitre -> Tool -> Arbitre)
    final_state = await app.ainvoke(initial_state)
    
    return final_state

async def main():
    # 1. Préparation
    await setup_database()

    # 2. Exécution du scénario d'attaque
    user_action = "Je frappe l'orc avec mon épée longue"
    final_state = await run_test_scenario(user_action)

    # 3. Analyse des résultats techniques
    print("\n[3/3] 📊 Analyse du flux de messages :")
    for msg in final_state["messages"]:
        role = msg.__class__.__name__
        content = msg.content if msg.content else f"Tool Call: {msg.tool_calls}"
        print(f"   🔹 {role}: {content}")

    # 4. LE VERDICT (L'assertion)
    final_hp = await verify_db_results()
    
    print("\n" + "="*40)
    if final_hp < 50:
        print(f"🔥 TEST RÉUSSI : L'orc a maintenant {final_hp} HP (Dégâts confirmés en DB)")
    else:
        print("❌ TEST ÉCHOUÉ : Les HP de l'orc n'ont pas bougé.")
    print("="*40 + "\n")

if __name__ == "__main__":
    # Lancement du test asynchrone
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"💥 Erreur fatale durant le test : {e}")