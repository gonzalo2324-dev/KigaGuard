const { AuditLogEvent } = require('discord.js');
const { handleActionLimit } = require('../utils/actionLimiter.js');
const { limitsCache } = require('../index.js'); // si esto te da error, pásalo como parámetro desde el client

module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelDelete,
      });

      const entry = auditLogs.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;

      await handleActionLimit(channel.guild, executor.id, executor.id, 'canales', client.limitsCache);
    } catch (error) {
      console.error('Error en evento channelDelete:', error);
    }
  },
};
