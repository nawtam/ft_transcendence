const { interpret, narrate } = require('../ia/client');
const { getSession, persistSession } = require('./sessionStore');
const { applyAction } = require('./applyAction');

async function handleTurn(userMessage, userId, gameId) {
  const session = getSession(gameId, userId);

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

  if (!gameResult.success) {
    return {
      type: 'narration',
      text: gameResult.error || 'Action impossible.',
      intent: interpretRes.intent,
      game_result: gameResult,
    };
  }

  session.recentEvents.push({
    fact: `Joueur ${userId} — ${gameResult.action || 'action'} — ${userMessage}`,
  });
  if (session.recentEvents.length > 20) {
    session.recentEvents.splice(0, session.recentEvents.length - 20);
  }

  persistSession(gameId, userId);

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
  if (session.messagesHistory.length > 40) {
    session.messagesHistory.splice(0, session.messagesHistory.length - 40);
  }

  persistSession(gameId, userId);

  return {
    type: 'narration',
    text: narrateRes.narrator_message,
    intent: interpretRes.intent,
    game_result: gameResult,
  };
}

module.exports = { handleTurn };