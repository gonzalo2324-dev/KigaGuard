// blacklist-sync.js

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Leer blacklist
const blacklistPath = path.join(__dirname, 'data', 'blacklist.json');
const channelPath = path.join(__dirname, 'data', 'blacklistChannel.json');

if (!fs.existsSync(blacklistPath)) {
  console.error('❌ No se encontró blacklist.json');
  process.exit(1);
}

const blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
const blacklistChannels = fs.existsSync(channelPath)
  ? JSON.parse(fs.readFileSync(channelPath, 'utf8'))
  : {};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel] // Para enviar DMs
});

client.once('ready', async () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
  const guildsArray = Array.from(client.guilds.cache.values());

  for (const [userId, data] of Object.entries(blacklist)) {
    const embed = {
      color: 0xff0000,
      title: '🚫 Usuario Globalmente Baneado',
      fields: [
        { name: 'Usuario', value: data.tag, inline: true },
        { name: 'ID Usuario', value: userId, inline: true },
        { name: 'Sanción', value: 'Ban global', inline: true },
        { name: 'Duración', value: 'Permanente', inline: true },
        { name: 'Motivo', value: data.reason, inline: false },
        { name: 'ID Acción', value: data.addedAt, inline: false }
      ],
      timestamp: new Date().toISOString()
    };

    // Intentar enviar DM
    try {
      const user = await client.users.fetch(userId);
      await user.send({ embeds: [embed] });
      console.log(`📩 DM enviado a ${data.tag}`);
    } catch {
      console.warn(`⚠️ No se pudo enviar DM a ${data.tag}`);
    }

    for (const guild of guildsArray) {
      try {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member) {
          if (guild.members.me.permissions.has('BanMembers')) {
            await member.ban({ reason: `[Blacklist Sync] ${data.reason}` });
            console.log(`🚫 Usuario ${data.tag} baneado de ${guild.name}`);
          } else {
            console.warn(`❌ Sin permisos de ban en ${guild.name}`);
          }
        }

        const channelId = blacklistChannels[guild.id];
        if (channelId) {
          const channel = guild.channels.cache.get(channelId);
          if (channel && channel.isTextBased()) {
            await channel.send({ embeds: [embed] });
            console.log(`📢 Embed enviado en ${guild.name}`);
          } else {
            console.warn(`⚠️ Canal inválido en ${guild.name}`);
          }
        } else {
          console.log(`ℹ️ No hay canal configurado para ${guild.name}`);
        }
      } catch (err) {
        console.warn(`❗ Error en ${guild.name}: ${err.message}`);
      }
    }
  }

  console.log('✅ Sincronización terminada.');
  process.exit(0);
});

client.login(process.env.TOKEN);
