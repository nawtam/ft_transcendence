from src.tools import WEAVER_TOOLS
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from src.core.state import State
from src.core.config import GROQ_API_KEY, GROQ_MODEL
from src.prompts.templates import WEAVER_SYSTEM_PROMPT


def get_weaver_llm():
    return ChatGroq(
        model=GROQ_MODEL,
        temperature=0,
        api_key=GROQ_API_KEY,
    )

async def call_weaver(state: State):
    llm = get_weaver_llm()
    llm_with_tools = llm.bind_tools(WEAVER_TOOLS)
    system = SystemMessage(content=WEAVER_SYSTEM_PROMPT.format(
        world_state_summary=str(state.get("world_state", {}))
    ))
    messages = [system] + state["messages"]
    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}