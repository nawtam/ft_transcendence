import src.core.config

from fastapi import FastAPI
from langchain_core.messages import HumanMessage, AIMessage
from src.schemas.game_state import GameRequest, GameResponse
from src.core.graph import game_graph

app = FastAPI()

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
        "player_stats": request.player_stats,
        "universe_context": request.universe_context,
        "world_state": request.world_state,
        "last_tool": {}
    }
    # Execute the IA graph with the initial state
    final_state = await game_graph.ainvoke(initial_state)

    # Extract the last message from the final state to construct the GameResponse
    last_msg = final_state["messages"][-1]

    # Construct and return the GameResponse based on the final state
    return GameResponse(
        narrator_message=last_msg.content,
        last_tool_result=final_state.get("last_tool"),
        updated_player_stats=final_state.get("player_stats"),
        updated_world_state=final_state.get("world_state"),
        stats_updated=final_state.get("player_stats") != request.player_stats
    )