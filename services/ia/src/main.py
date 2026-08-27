from contextlib import asynccontextmanager
from src.memory.database import init_pool, close_pool
import src.core.config

from fastapi import FastAPI
from langchain_core.messages import HumanMessage, AIMessage
from src.schemas.game_state import GameRequest, GameResponse
from src.core.graph import game_graph

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    yield
    await close_pool()

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ia",    
    }

@app.post("/game", response_model=GameResponse)
async def game_endpoint(request: GameRequest):
    # transform the GameRequest into the State format expected by the graph
    formatted_history = []
    for msg in request.messages_history:
        if msg.get("role") == "user":
            formatted_history.append(HumanMessage(content=msg["content"]))
        else:
            formatted_history.append(AIMessage(content=msg["content"]))

    # Add the current user message to the history
    formatted_history.append(HumanMessage(content=request.user_message))

    # Prepare the initial state for the graph execution
    initial_state = {
        "messages": formatted_history,
        "narrator_message": "",
        "player_stats": request.player_stats.model_dump(),
        "universe_context": request.universe_context,
        "world_state": request.world_state.model_dump(),
        "last_tool": {}
    }
    # Execute the IA graph with the initial state
    final_state = await game_graph.ainvoke(initial_state)

    # Construct and return the GameResponse based on the final state
    return GameResponse(
        narrator_message=final_state.get("narrator_message", ""),
        last_tool_result=final_state.get("last_tool"),
        updated_player_stats=final_state.get("player_stats"),
        updated_world_state=final_state.get("world_state"),
        stats_updated=(
            final_state.get("player_stats") != request.player_stats.model_dump()
        ),
    )