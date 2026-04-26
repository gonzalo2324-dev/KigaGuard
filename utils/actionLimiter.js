const { alertConfigCache } = require('../index.js'); // si te da error esto, tendrás que pasar el cache como parámetro

const actionCounters = new Map();

function getActionKey(guildId, userId, action) {
  return `${guildId}_${userId}_${action}`;
}

function getLimitForAction(action, limitsCache) {
  if (!limitsCache) return 3;
  return limitsCache[action] ?? 3;
}

async function handleActionLimit(guild, userId, executorId, action, limitsCache) {
  const key = getActionKey(guild.id, userId, action);
  const now = Date.now();

  if (!actionCounters.has(key)) {
    actionCounters.set(key, []);
  }

  const timestamps = actionCounters.get(key);
  while (timestamps.length && now - timestamps[0] > 60000) {
    timestamps.shift();
  }

  timestamps.push(now);

  const limit = getLimitForAction(action, limitsCache);
  if (timestamps.length > limit) {
    try {
      const member = await guild.members.fetch(userId);
      await member.ban({
        reason: `Superó el límite de ${limit} acciones de tipo ${action} en 60 segundos.`,
      });
      console.log(`🚫 Usuario ${member.user.tag} baneado por exceso de ${action}`);

      const alertChannelId = alertConfigCache[guild.id];
      if (alertChannelId) {
        const alertChannel = guild.channels.cache.get(alertChannelId);
        if (alertChannel?.isTextBased()) {
          alertChannel.send(`⚠️ <@${userId}> fue baneado por exceder el límite de ${action}.`);
        }
      }
    } catch (e) {
      console.error('❌ No se pudo banear al usuario:', e);
    }
    actionCounters.delete(key);
  } else {
    actionCounters.set(key, timestamps);
  }
}

module.exports = {
  handleActionLimit,
};
