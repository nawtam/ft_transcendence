import json

import src.core.config

from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from src.agents.narrator import call_narrator
from src.agents.referee import call_referee
from src.agents.weaver import call_weaver
from src.core.state import State
from src.tools import ALL_TOOLS

_tool_node = ToolNode(ALL_TOOLS)


def route_referee(state: State) -> str:
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return "narrator"

def route_weaver(state: State) -> str:
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return END

def route_tools(state: State) -> str:
    last_tool_name = state.get("last_tool", {}).get("tool_name")
    if last_tool_name == "record_world_event":
        return END
    return "narrator"

def _parse_tool_content(content) -> dict | str | None:
    if content is None:
        return None
    if isinstance(content, dict):
        return content
    if isinstance(content, str):
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return content
    return content

def _apply_pickup_item(state: State, result: dict) -> dict:
    """If pickup_item succeeded, add the item to the inventory."""
    player_stats = dict(state.get("player_stats") or {})
    inventory = list(player_stats.get("inventory") or [])
    world_state = dict(state.get("world_state") or {})
    room_items = list(world_state.get("room_items") or [])

    item = result.get("item")
    if not item:
        return player_stats, world_state

    item_name = item.get("name", "").strip().lower()
    for existing in inventory:
        if existing.get("name", "").lower() == item_name:
            result["error"] = f"Item '{item['name']}' already in inventory."
            result["success"] = False
            return player_stats, world_state

    found_index = None
    found_item = None
    for i, existing in enumerate(room_items):
        if existing.get("name", "").lower() == item_name:
            found_index = i
            found_item = existing
            break

    if found_index is None:
        result["success"] = False
        result["error"] = f"Item '{result.get('item_name')}' not in this room."
        return player_stats, world_state
    
    room_items.pop(found_index)
    inventory.append(found_item)

    player_stats["inventory"] = inventory
    world_state["room_items"] = room_items


    return player_stats, world_state

def _apply_use_item(state: State, result: dict) -> dict:
    """If use_item succeeded, remove the item and apply effects."""
    player_stats = dict(state.get("player_stats") or {})
    inventory = list(player_stats.get("inventory") or [])

    item_name = (result.get("item_name") or "").strip().lower()
    if not item_name:
        result["success"] = False
        result["error"] = "Item name is required."
        return player_stats

    found_index = None
    found_item = None
    for i, existing in enumerate(inventory):
        if existing.get("name", "").lower() == item_name:
            found_index = i
            found_item = existing
            break

    if found_index is None:
        result["success"] = False
        result["error"] = f"Item '{result.get('item_name')}' not in inventory."
        return player_stats

    inventory.pop(found_index)
    player_stats["inventory"] = inventory

    if found_item.get("type") == "consumable":
        hp = int(player_stats.get("hp", 0))
        max_hp = int(player_stats.get("max_hp", hp))
        healed = 20
        new_hp = min(max_hp, hp + healed)
        player_stats["hp"] = new_hp
        result["hp_restored"] = new_hp - hp
        result["hp"] = new_hp

    result["item"] = found_item
    return player_stats

async def execute_tools(state: State) -> dict:
    result = await _tool_node.ainvoke(state)

    last_ai_message = state["messages"][-1]
    tool_messages = result.get("messages", [])
    last_tool: dict = {}

    if getattr(last_ai_message, "tool_calls", None) and tool_messages:
        tool_call = last_ai_message.tool_calls[0]
        tool_message = tool_messages[-1]
        parsed_result = _parse_tool_content(tool_message.content)

        last_tool = {
            "tool_name": tool_call["name"],
            "args": tool_call["args"],
            "result": parsed_result,
            "error": parsed_result.get("error") if isinstance(parsed_result, dict) else None,
        }

        updates: dict = {**result, "last_tool": last_tool}
        player_stats = state.get("player_stats")

        if (
            last_tool.get("tool_name") == "pickup_item"
            and isinstance(parsed_result, dict)
            and parsed_result.get("success")
        ):
            player_stats, world_state = _apply_pickup_item(state, parsed_result)
            last_tool["result"] = parsed_result
            last_tool["error"] = parsed_result.get("error")
            updates["last_tool"] = last_tool
            updates["player_stats"] = player_stats
            updates["world_state"] = world_state
        
        if (
            last_tool.get("tool_name") == "use_item"
            and isinstance(parsed_result, dict)
            and parsed_result.get("success")
        ):
            player_stats = _apply_use_item(state, parsed_result)
            last_tool["result"] = parsed_result
            last_tool["error"] = parsed_result.get("error")
            updates["last_tool"] = last_tool
            updates["player_stats"] = player_stats

        return updates

    return {**result, "last_tool": last_tool}


workflow = StateGraph(State)

workflow.add_node("referee", call_referee)
workflow.add_node("tools", execute_tools)
workflow.add_node("narrator", call_narrator)
workflow.add_node("weaver", call_weaver)

workflow.set_entry_point("referee")

workflow.add_conditional_edges(
    "referee",
    route_referee,
    {
        "tools": "tools",
        "narrator": "narrator",
    }
)

workflow.add_conditional_edges(
    "tools",
    route_tools,
    {
        "narrator": "narrator",
        END: END
    }
)

workflow.add_edge("narrator", "weaver")
workflow.add_conditional_edges(
    "weaver",
    route_weaver,
    {
        "tools": "tools",
        END: END
    }
)

game_graph = workflow.compile()
