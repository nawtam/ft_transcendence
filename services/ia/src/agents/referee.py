import os
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.tools import tool

from src.core.state import State
from src.prompts.templates import REFEREE_SYSTEM_PROMPT

def get_referee_llm() -> ChatGroq:
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=os.environ["GROQ_API_KEY"],
)

@tool
def	attack_enemy(target: str, weapon: str) -> str:
	"""
	Executes a physical attack sequence.

	Args:
		target (str): The exact name of the enemy character to hit.
		weapon (str): The name of the weapon the player is using from their inventory.

	Requirements:
		Only use this tool if the user's itent is clearly offensive.
		If the target is not provided, do not guess; ask for clarification.
	"""
	return f"Technical result: Attack initiated on {target} with {weapon}"

def _summarize_stats(stats: dict) -> str:
    hp = stats.get("hp", "?")
    max_hp = stats.get("max_hp", "?")
    location = stats.get("location", "unknown")
    weapons = [i["name"] for i in stats.get("inventory", []) if i.get("type") == "weapon"]
    return f"HP: {hp}/{max_hp}, Location: {location}, Weapons: {', '.join(weapons) or 'none'}"

TOOLS = [attack_enemy]

async def call_referee(state: State):
    
	llm = get_referee_llm() 
	llm_with_tools = llm.bind_tools(TOOLS)

	system = SystemMessage(content=REFEREE_SYSTEM_PROMPT.format(
		universe_context=state["universe_context"],
		player_stats_summary=_summarize_stats(state["player_stats"]),
	))
	messages = [system] + state["messages"]
	response: AIMessage = await llm_with_tools.invoke(messages)
	return {"messages": [response]}
