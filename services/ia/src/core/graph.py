import json

import src.core.config

from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from src.agents.narrator import call_narrator
from src.agents.referee import call_referee
from src.core.state import State
from src.tools import ALL_TOOLS

_tool_node = ToolNode(ALL_TOOLS)


def route_referee(state: State) -> str:
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return END

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

        return updates

    return {**result, "last_tool": last_tool}


workflow = StateGraph(State)

workflow.add_node("referee", call_referee)
workflow.add_node("tools", execute_tools)

workflow.set_entry_point("referee")

workflow.add_conditional_edges(
    "referee",
    route_referee,
    {
        "tools": "tools",
        END: END,
    },
)

workflow.add_edge("tools", END)

narrate_workflow = StateGraph(State)
narrate_workflow.add_node("narrator", call_narrator)
narrate_workflow.set_entry_point("narrator")
narrate_workflow.add_edge("narrator", END)

narrate_graph = narrate_workflow.compile()

interpret_graph = workflow.compile()
