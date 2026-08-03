from langchain_groq import ChatGroq
from langchain_core.messages import AIMessage, SystemMessage

from src.core.config import GROQ_API_KEY, GROQ_MODEL
from src.core.state import State
from src.prompts.templates import REFEREE_SYSTEM_PROMPT
from src.tools import TOOLS

_referee_llm: ChatGroq | None = None


def get_referee_llm() -> ChatGroq:
    global _referee_llm
    if _referee_llm is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY manquante — vérifie ton .env")
        _referee_llm = ChatGroq(
            model=GROQ_MODEL,
            temperature=0,
            api_key=GROQ_API_KEY,
        )
    return _referee_llm


def _summarize_stats(stats: dict) -> str:
    hp = stats.get("hp", "?")
    max_hp = stats.get("max_hp", "?")
    location = stats.get("location", "unknown")
    weapons = [
        item["name"]
        for item in stats.get("inventory", [])
        if item.get("type") == "weapon"
    ]
    return f"HP: {hp}/{max_hp}, Location: {location}, Weapons: {', '.join(weapons) or 'none'}"


async def call_referee(state: State) -> dict:
    llm_with_tools = get_referee_llm().bind_tools(TOOLS)

    system = SystemMessage(
        content=REFEREE_SYSTEM_PROMPT.format(
            universe_context=state["universe_context"],
            player_stats_summary=_summarize_stats(state["player_stats"]),
        )
    )
    messages = [system] + state["messages"]
    response: AIMessage = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}
