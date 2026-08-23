import json

import src.core.config  # noqa: F401 — charge le .env avant les agents

from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from src.agents.narrator import call_narrator
from src.agents.referee import call_referee
from src.agents.weaver import call_weaver
from src.core.state import State
from src.tools import TOOLS

_tool_node = ToolNode(TOOLS)


def should_continue(state: State) -> str:
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
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

    return {**result, "last_tool": last_tool}


workflow = StateGraph(State)

workflow.add_node("referee", call_referee)
workflow.add_node("tools", execute_tools)
workflow.add_node("narrator", call_narrator)
workflow.add_node("weaver", call_weaver)

workflow.set_entry_point("referee")

workflow.add_conditional_edges(
    "referee",
    should_continue,
    {"tools": "tools", "narrator": "narrator"},
)

workflow.add_edge("tools", "narrator")
workflow.add_edge("narrator", "weaver")
workflow.add_edge("weaver", END)

game_graph = workflow.compile()
