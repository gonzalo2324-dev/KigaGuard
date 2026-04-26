const fs = require('fs').promises;
const path = require('path');
const { PermissionsBitField } = require('discord.js');

const pendingBansPath = path.join(__dirname, 'data', 'pendingBans.json');

const readJson = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data || '{}');
  } catch {
    return {};
  }
};

const writeJson = async (filePath, data) => {
  return fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Función para intentar banear usuarios pendientes en un servidor
async function procesarPendingBansEnGuild(guild, pendingBans) {
  const botMember = guild.members.me;
  if (!botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
    // Sin permiso de ban, no podemos hacer nada
    return;
  }

  if (!pendingBans[guild.id]) return;

  const idsPendientes = Object.keys(pendingBans[guild.id]);
  for (const userId of idsPendientes) {
    try {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) continue; // No está en el servidor

      await member.ban({ reason: 'Baneo pendiente en blacklist global' });
      console.log(`✅ Usuario ${member.user.tag} baneado en ${guild.name} (pendingBan)`);

      // Quitar de pendingBans
      delete pendingBans[guild.id][userId];
    } catch (error) {
      console.error(`❌ Error baneando usuario pendiente ${userId} en ${guild.name}:`, error);
    }
  }
}

module.exports = (client) => {
  client.on('guildMemberAdd', async (member) => {
    const pendingBans = await readJson(pendingBansPath);
    if (pendingBans[member.guild.id] && pendingBans[member.guild.id][member.id]) {
      try {
        if (!member.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          console.log(`⚠️ No tengo permisos para banear en ${member.guild.name} al entrar ${member.user.tag}`);
          return;
        }
        await member.ban({ reason: 'Baneo pendiente en blacklist global (al entrar)' });
        console.log(`✅ Usuario ${member.user.tag} baneado automáticamente al entrar a ${member.guild.name}`);

        // Eliminar de pendingBans
        delete pendingBans[member.guild.id][member.id];
        await writeJson(pendingBansPath, pendingBans);
      } catch (error) {
        console.error(`❌ Error baneando usuario pendiente al entrar:`, error);
      }
    }
  });

  // Escáner cada 20 minutos para revisar pendingBans en todos los servidores
  setInterval(async () => {
    const pendingBans = await readJson(pendingBansPath);
    for (const [guildId, guild] of client.guilds.cache) {
      await procesarPendingBansEnGuild(guild, pendingBans);
    }
    await writeJson(pendingBansPath, pendingBans);
  }, 20 * 60 * 1000); // 20 minutos
};
