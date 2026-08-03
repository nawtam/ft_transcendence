# src/agents/narrator.py
import os
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from src.core.state import State
from src.prompts.templates import NARRATOR_SYSTEM_PROMPT

llm_narrator = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7, 
    api_key=os.environ.get("GROQ_API_KEY")
)

async def call_narrator(state: State):
    system = SystemMessage(content=NARRATOR_SYSTEM_PROMPT.format(
        universe_context=state["universe_context"]
    ))
    
    messages = [system] + state["messages"]
    
    response = await llm_narrator.ainvoke(messages)
    
    return {"messages": [response]}