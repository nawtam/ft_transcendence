from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage

from src.core.config import GROQ_API_KEY, GROQ_MODEL
from src.core.state import State
from src.prompts.templates import NARRATOR_SYSTEM_PROMPT

_narrator_llm: ChatGroq | None = None


def get_narrator_llm() -> ChatGroq:
    global _narrator_llm
    if _narrator_llm is None:
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY manquante — vérifie ton .env")
        _narrator_llm = ChatGroq(
            model=GROQ_MODEL,
            temperature=0.7,
            api_key=GROQ_API_KEY,
        )
    return _narrator_llm


def _format_last_tool(last_tool: dict) -> str:
    if not last_tool:
        return "Aucun résultat technique récent."
    return (
        f"Outil: {last_tool.get('tool_name', 'unknown')}\n"
        f"Args: {last_tool.get('args', {})}\n"
        f"Résultat: {last_tool.get('result', {})}"
    )


async def call_narrator(state: State) -> dict:
    system = SystemMessage(
        content=NARRATOR_SYSTEM_PROMPT.format(
            universe_context=state["universe_context"],
            last_tool_summary=_format_last_tool(state.get("last_tool", {})),
        )
    )

    messages = [system] + state["messages"]
    response = await get_narrator_llm().ainvoke(messages)
    return {"messages": [response]}
