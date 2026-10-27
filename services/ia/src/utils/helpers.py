from langchain_core.messages import AIMessage, HumanMessage


def format_messages_history(
    messages_history: list[dict[str, str]],
    user_message: str,
) -> list:
    formatted = []
    for msg in messages_history:
        if msg.get("role") == "user":
            formatted.append(HumanMessage(content=msg["content"]))
        else:
            formatted.append(AIMessage(content=msg["content"]))
    formatted.append(HumanMessage(content=user_message))
    return formatted