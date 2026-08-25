import os
import asyncpg
from langchain_core.tools import tool
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

@tool
async def record_world_event(event_description: str):
    """
    Saves a permanent change in the world's history.
    Use this for deaths, found items, or any other event that should persist across sessions.
    Arguments:
        event_description (str): A description of the event to be recorded.
    """
    # I will put the SQL or database logic here to save the event_description to a persistent store.
    return f"World history updated: {event_description}"

async def call_weaver(state: State):
    llm = get_weaver_llm()
    tools = [record_world_event]
    llm_with_tools = llm.bind_tools(tools)

    system = SystemMessage(content=WEAVER_SYSTEM_PROMPT.format(
        world_state_summary=str(state.get("world_state", {}))
    ))
    messages = [system] + state["messages"]
    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}