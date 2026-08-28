from typing	import TypedDict, Annotated, Any
from langgraph.graph.message import add_messages
from langchain_core.messages.base import BaseMessage

class	State(TypedDict):
	messages: Annotated[list[BaseMessage], add_messages]
	narrator_message: str
	player_stats: dict[str, Any]
	universe_context: str
	last_tool: dict[str, Any]
	world_state: dict[str, Any]