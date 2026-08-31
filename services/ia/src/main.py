import src.core.config

from fastapi import FastAPI
from langchain_core.messages import HumanMessage, AIMessage
from src.schemas.game_state import InterpretRequest, InterpretResponse, NarrateRequest, NarrateResponse
from src.core.graph import interpret_graph, narrate_graph

app = FastAPI()

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ia",    
    }

@app.post("/interpret", response_model=InterpretResponse)
async def interpret_endpoint(request: InterpretRequest):
    formatted_history = []
    for msg in request.messages_history:
        if msg.get("role") == "user":
            formatted_history.append(HumanMessage(content=msg["content"]))
        else:
            formatted_history.append(AIMessage(content=msg["content"]))
    formatted_history.append(HumanMessage(content=request.user_message))

    initial_state = {
        "messages": formatted_history,
        "narrator_message": "",
        "player_stats": request.player_stats.model_dump(),
        "universe_context": request.universe_context,
        "world_state": request.world_state.model_dump(),
        "last_tool": {},
    }

    final_state = await interpret_graph.ainvoke(initial_state)
    intent = final_state.get("last_tool") or None

    clarification = None
    if not intent:
        last_msg = final_state["messages"][-1]
        clarification = getattr(last_msg, "content", None)

    return InterpretResponse(intent=intent, clarification=clarification)

@app.post("/narrate", response_model=NarrateResponse)
async def narrate_endpoint(request: NarrateRequest):
    formatted_history = []
    for msg in request.messages_history:
        if msg.get("role") == "user":
            formatted_history.append(HumanMessage(content=msg["content"]))
        else:
            formatted_history.append(AIMessage(content=msg["content"]))
    formatted_history.append(HumanMessage(content=request.user_message))

    initial_state = {
        "messages": formatted_history,
        "narrator_message": "",
        "player_stats": {},
        "universe_context": request.universe_context,
        "world_state": {},
        "last_tool": {"result": request.game_result},
    }
    final_state = await narrate_graph.ainvoke(initial_state)
    return NarrateResponse(narrator_message=final_state.get("narrator_message", ""))