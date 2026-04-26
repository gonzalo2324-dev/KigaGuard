const fs = require('fs');
const path = require('path');

// Rutas de archivos
const limitsPath = path.join(__dirname, '../data/antiraidLimits.json');
const alertConfigPath = path.join(__dirname, '../data/alertConfig.json');

// Cargar archivos manualmente (sin index.js)
const loadJSON = (filePath, fallback = {}) => {
  try {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback;
  } catch (e) {
    console.error(`❌ Error cargando archivo: ${filePath}`, e);
    return fallback;
  }
};

const saveJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`❌ Error guardando archivo: ${filePath}`, e);
  }
};

const isOwner = (userId) => {
  const owners = process.env.OWNERS ? process.env.OWNERS.split(',') : [];
  return owners.includes(userId);
};

async function handleActionLimit(guild, userId, executorId, funcion) {
  const limitsCache = loadJSON(limitsPath);
  const alertConfigCache = loadJSON(alertConfigPath);

  const now = Date.now();
  const key = `${guild.id}_${userId}_${funcion}`;

  if (!limitsCache[key]) {
    limitsCache[key] = {
      count: 1,
      lastAction: now
    };
  } else {
    const entry = limitsCache[key];
    const diff = now - entry.lastAction;

    if (diff > 60000) {
      entry.count = 1;
      entry.lastAction = now;
    } else {
      entry.count++;
    }

    if (entry.count >= 3 && !isOwner(userId)) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member && member.bannable) {
        await member.ban({ reason: `Exceso de acciones: ${funcion}` }).catch(() => {});
      }

      if (alertConfigCache[guild.id]) {
        const { enabled, channelId } = alertConfigCache[guild.id];
        if (enabled && channelId) {
          const channel = guild.channels.cache.get(channelId);
          if (channel && channel.isTextBased()) {
            await channel.send(`🚨 **${member.user.tag}** ha sido baneado por spam de **${funcion}**.`);
          }
        }
      }

      delete limitsCache[key];
    }
  }

  saveJSON(limitsPath, limitsCache);
}

module.exports = {
  handleActionLimit
};
