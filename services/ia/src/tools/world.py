from langchain_core.tools import tool


@tool
async def record_world_event(event_description: str):
    """
    Saves a permanent change in the world's history.
    Use this for deaths, found items, or any other event that should persist across sessions.
    Arguments:
        event_description (str): A description of the event to be recorded.
    """
    # I will put the SQL or database logic here to save the event_description to a persistent store.
    return f"World history updated: {event_description}"