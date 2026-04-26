// 📁 Archivo: events/guildMemberAdd.js
const { Events } = require('discord.js');
const path = require('path');
const fs = require('fs');

// Unificamos el nombre del archivo de configuración
const configPath = path.join(__dirname, '..', 'data', 'verificacionConfig.json'); 
const blacklistPath = path.join(__dirname, '..', 'data', 'blacklist.json');

function readConfig() {
  if (!fs.existsSync(configPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error('❌ Error leyendo la configuración de verificación:', err);
    return {};
  }
}

function readBlacklist() {
  if (!fs.existsSync(blacklistPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
  } catch (err) {
    console.error('❌ Error leyendo la blacklist:', err);
    return {};
  }
}

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      // 📌 Asignar rol de "No Verificado" si está configurado
      const config = readConfig();
      const serverConfig = config[member.guild.id];
      if (serverConfig && serverConfig.rolNoVerificadoId) {
        const rol = member.guild.roles.cache.get(serverConfig.rolNoVerificadoId);
        if (rol) {
          await member.roles.add(rol).catch(err => {
            console.error(`❌ Error asignando rol de no verificado a ${member.user.tag}:`, err);
          });
        }
      }

      // 📌 Comprobar si el usuario está en blacklist global
      const blacklist = readBlacklist();
      const data = blacklist[member.id];
      if (data) {
        await member.ban({
          reason: `🛑 Usuario en blacklist global: ${data.reason || 'Sin razón'}`
        });

        const defaultChannel = member.guild.channels.cache.find(
          c => c.type === 0 && c.permissionsFor(member.guild.members.me)?.has('SendMessages')
        );

        if (defaultChannel) {
          const embed = {
            color: 0xff0000,
            title: '🚨 Usuario en blacklist detectado',
            description: `Se ha baneado a <@${member.id}> (\`${data.tag || 'Desconocido'}\`) automáticamente.`,
            fields: [
              { name: '📝 Razón', value: data.reason || 'Sin razón' },
            ],
            timestamp: new Date(),
            footer: {
              text: `${process.env.NOMBRE_BOT || 'Bot'} - Protección activa 🔐`,
            },
          };
          await defaultChannel.send({ embeds: [embed] }).catch(() => {});
        }

        console.log(`⛔ Usuario ${member.user.tag} baneado automáticamente al unirse (blacklist).`);
      }
    } catch (err) {
      console.error(`❌ Error en guildMemberAdd para ${member.user.tag}:`, err);
    }
  }
};
