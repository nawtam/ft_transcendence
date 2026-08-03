import os
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.tools import tool
import random
import asyncpg

from src.core.state import State
from src.prompts.templates import REFEREE_SYSTEM_PROMPT

def get_referee_llm() -> ChatGroq:
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=os.environ["GROQ_API_KEY"],
)

@tool
async def attack_enemy(target: str, weapon: str) -> str:
    """
    Executes a physical attack sequence against a named monster.
    
    Args:
        target: The name of the monster to attack (e.g., 'Orc').
        weapon: The weapon used for the attack.
    """
    # 1. Récupération de l'URL depuis l'environnement
    db_url = os.getenv("DATABASE_URL")
    
    # 2. Connexion à la base de données
    conn = await asyncpg.connect(db_url)
    
    try:
        # 3. Vérifier si le monstre existe et récupérer ses PV
        monster = await conn.fetchrow(
            "SELECT id, hp, max_hp FROM monsters WHERE name = $1", 
            target
        )
        
        if not monster:
            return f"Technical Error: Target '{target}' not found in the database."

        # 4. Logique de combat (Dés)
        # On simule un dé 20 pour toucher et un dé 8 pour les dégâts
        hit_roll = random.randint(1, 20)
        damage = random.randint(5, 12) # Dégâts de base
        
        if hit_roll == 1: # Échec critique
            return f"{{'success': false, 'reason': 'critical_miss', 'target': '{target}'}}"
        
        # 5. Application des dégâts
        new_hp = max(0, monster['hp'] - damage)
        
        # 6. Mise à jour de la base de données
        await conn.execute(
            "UPDATE monsters SET hp = $1 WHERE id = $2", 
            new_hp, monster['id']
        )
        
        # 7. Retour structuré pour le Narrateur
        # On renvoie un JSON sous forme de chaîne de caractères
        return f"{{'success': true, 'damage': {damage}, 'target': '{target}', 'hp_left': {new_hp}, 'weapon': '{weapon}'}}"

    except Exception as e:
        return f"Technical Error during combat: {str(e)}"
    
    finally:
        # Crucial : Toujours fermer la connexion
        await conn.close()

def _summarize_stats(stats: dict) -> str:
    hp = stats.get("hp", "?")
    max_hp = stats.get("max_hp", "?")
    location = stats.get("location", "unknown")
    weapons = [i["name"] for i in stats.get("inventory", []) if i.get("type") == "weapon"]
    return f"HP: {hp}/{max_hp}, Location: {location}, Weapons: {', '.join(weapons) or 'none'}"

TOOLS = [attack_enemy]

llm = get_referee_llm() 

async def call_referee(state: State):

	llm_with_tools = llm.bind_tools(TOOLS)

	system = SystemMessage(content=REFEREE_SYSTEM_PROMPT.format(
		universe_context=state["universe_context"],
		player_stats_summary=_summarize_stats(state["player_stats"]),
	))
	messages = [system] + state["messages"]
	print(f"DEBUG: Envoi de {len(messages)} messages à Groq...")
	response: AIMessage = await llm_with_tools.ainvoke(messages)
	return {"messages": [response]}
