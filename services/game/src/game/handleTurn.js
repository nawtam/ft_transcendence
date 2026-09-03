const { interpret, narrate } = require('../ia/client');
const { getSession } = require('./sessionStore');
const { applyAction } = require('./applyAction');

async function handleTurn(userMessage, userId) {
  const session = getSession(userId);

  const interpretRes = await interpret({
    user_message: userMessage,
    messages_history: session.messagesHistory,
    player_stats: session.playerStats,
    universe_context: session.universeContext,
    world_state: session.worldState,
    world_flags: session.worldFlags,
    recent_events: session.recentEvents,
  });

  if (interpretRes.clarification && !interpretRes.intent) {
    return { type: 'clarification', text: interpretRes.clarification };
  }

  const gameResult = applyAction(session, interpretRes.intent);

  const narrateRes = await narrate({
    user_message: userMessage,
    messages_history: session.messagesHistory,
    universe_context: session.universeContext,
    game_result: gameResult,
  });

  session.messagesHistory.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: narrateRes.narrator_message },
  );

  return {
    type: 'narration',
    text: narrateRes.narrator_message,
    intent: interpretRes.intent,
    game_result: gameResult,
  };
}

module.exports = { handleTurn };