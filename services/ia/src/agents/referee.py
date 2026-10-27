from langchain_groq import ChatGroq
from langchain_core.messages import AIMessage, SystemMessage

from src.core.config import GROQ_API_KEY, GROQ_MODEL
from src.core.state import State
from src.prompts.templates import REFEREE_SYSTEM_PROMPT
from src.tools import REFEREE_TOOLS

_referee_llm: ChatGroq | None = None


def get_referee_llm() -> ChatGroq:
    global _referee_llm
    if _referee_llm is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY not found — check your .env file")
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

def _summarize_world_state(world: dict) -> str:
    room = world.get("current_room", "unknown")
    items = [i.get("name", "?") for i in world.get("room_items") or []]
    exits = world.get("available_exits") or []
    return (
        f"Room: {room}, "
        f"Items here: {', '.join(items) or 'none'}, "
        f"Exits: {', '.join(exits) or 'none'}"
    )

def _summarize_memory(flags: list, events: list) -> str:
    flags_txt = ", ".join(flags) if flags else "none"
    if not events:
        return f"Flags: {flags_txt}. Recent events: none."
    lines = [str(e.get("fact", e)) for e in events[-5:]]  # max 5
    return f"Flags: {flags_txt}. Recent events: {'; '.join(lines)}"

async def call_referee(state: State) -> dict:
    llm_with_tools = get_referee_llm().bind_tools(REFEREE_TOOLS)

    system = SystemMessage(
        content=REFEREE_SYSTEM_PROMPT.format(
            universe_context=state["universe_context"],
            player_stats_summary=_summarize_stats(state["player_stats"]),
            world_state_summary=_summarize_world_state(state.get("world_state") or {}),
            world_memory_summary=_summarize_memory(
                state.get("world_flags") or [],
                state.get("recent_events") or [],
            ),
        )
    )
    messages = [system] + state["messages"]
    response: AIMessage = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}
