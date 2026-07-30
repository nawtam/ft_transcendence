import os
from groq import Groq
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

def call_referee(State: State):
	
	return {"messages": [ia_response]}


@tool
def	attaquer(cible: str):
	"""Utilise cet outil quand le joueur veut attaquer un ennemi."""
	# PLUS TARD FAUDRA METTRE LE CODE QUI TOUCHE A LA DB ICI.
	return f"L'attaque sur {cible} est enregistree."
