from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from src.core.state import State
from src.agents.referee import call_referee, TOOLS
from src.agents.narrator import call_narrator

tool_node = ToolNode(TOOLS)

def	should_continue(state: State):
	messages = state["messages"]
	last_message = messages[-1]

	if last_message.tool_calls:
		return "tools"

	return "narrator"

workflow = StateGraph(State)

workflow.add_node("referee", call_referee)
workflow.add_node("tools", tool_node)
workflow.add_node("narrator", call_narrator)

workflow.set_entry_point("referee")

workflow.add_conditional_edges(
	"referee",
	should_continue,
)

workflow.add_edge("tools", "narrator")
workflow.add_edge("narrator", END)

app = workflow.compile()