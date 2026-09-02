const { applyPickup } = require('./handlers/pickup');
const { applyExamine } = require('./handlers/examine');
const { applyMove } = require('./handlers/move');
const { applyUse } = require('./handlers/use');
const { applyAttack } = require('./handlers/attack');

function applyAction(session, intent) {
  const action = intent?.result?.action;

  switch (action) {
    case 'picked_up':
        return applyPickup(session, intent);
    case 'examine':
        return applyExamine(session, intent);
    case 'move':
        return applyMove(session, intent);
    case 'used':
        return applyUse(session, intent);
    case 'attack':
        return applyAttack(session, intent);
    default:
      return {
        success: false,
        action: action || 'unknown',
        error: `Handler not implemented yet for action: ${action}`,
      };
  }
}

module.exports = { applyAction };