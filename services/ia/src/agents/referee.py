import os
from groq import Groq
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

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
		target_name (str): The exact name of the enemy character to hit.
		weapon_used (str): The name of the weapon the player is using from their inventory.

	Requirements:
		Only use this tool if the user's itent is clearly offensive.
		If the target_name is not provided, do not guess; ask for clarification.
	"""
	return f"Technical result: Attack initiated on {target} with {weapon}"



def call_referee(State: State):
	tools = [attack_enemy]
	system_prompt = SystemMessage(content="Your technical instructions here...")
	return {"messages": [ia_response]}
