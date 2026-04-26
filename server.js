require('dotenv').config();
const { Client, GatewayIntentBits, Collection, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

// Propietarios del bot
const owners = process.env.OWNERS ? process.env.OWNERS.split(',') : [];
function isOwner(userId) {
  return owners.includes(userId);
}

// Crear cliente
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Cargar comandos
client.commands = new Collection();
const commandDir = path.join(__dirname, 'commands', 'moderacion');
if (fs.existsSync(commandDir)) {
  const commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(commandDir, file));
    if (command?.data?.name && typeof command.execute === 'function') {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`⚠️ Comando inválido en: ${file}`);
    }
  }
}

// Cargar eventos automáticamente desde /events
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.name && typeof event.execute === 'function') {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    } else {
      console.warn(`⚠️ Evento inválido en: ${file}`);
    }
  }
}

// Paths de configuración
const whitelistPath = path.join(__dirname, 'data', 'whitelistData.json');
const alertConfigPath = path.join(__dirname, 'data', 'alertConfig.json');
const limitsPath = path.join(__dirname, 'data', 'antiraidLimits.json');
const blacklistPath = path.join(__dirname, 'data', 'blacklist.json');
const blacklistChannelPath = path.join(__dirname, 'data', 'blacklistChannel.json');
const pendingBansPath = path.join(__dirname, 'data', 'pendingBans.json');

// Caches
let whitelistCache = {};
let alertConfigCache = {};
let limitsCache = {};
let blacklistCache = {};
let blacklistChannelCache = {};

function loadJSON(filePath, fallback = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      return fallback;
    }
  } catch (e) {
    console.error(`❌ Error leyendo archivo: ${filePath}`, e);
    return fallback;
  }
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`❌ Error guardando archivo: ${filePath}`, e);
  }
}

function loadCache() {
  whitelistCache = loadJSON(whitelistPath);
  alertConfigCache = loadJSON(alertConfigPath);
  limitsCache = loadJSON(limitsPath);
  blacklistCache = loadJSON(blacklistPath);
  blacklistChannelCache = loadJSON(blacklistChannelPath);
}

loadCache();
client.reloadCaches = loadCache;

const actionLogs = new Map();

console.log(`🔄 Iniciando ${process.env.NOMBRE_BOT || 'Bot'}...`);

// Evento de inicio
client.once('ready', () => {
  console.log(`✅ Bot listo! Conectado como ${client.user.tag}`);
  revisarPermisosBot();
  setInterval(revisarPermisosBot, 20 * 60 * 1000); // Cada 20 min
});

// Evento guildCreate - Blacklist al entrar (Solo banea si el usuario está en el servidor)
client.on('guildCreate', async (guild) => {
  console.log(`🚨 Me uní a un nuevo servidor: ${guild.name}`);

  const blacklist = blacklistCache || {};
  const bannedUsers = [];

  for (const userId of Object.keys(blacklist)) {
    try {
      // Intentamos buscar el miembro, si no está, no hacemos nada
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) continue; // Si no está el usuario en el servidor, saltar

      await member.ban({
        reason: `🛑 Usuario en blacklist global: ${blacklist[userId].reason || 'Sin razón'}`,
      });
      bannedUsers.push({
        id: userId,
        tag: blacklist[userId].tag || 'Desconocido',
        reason: blacklist[userId].reason || 'Sin razón',
      });
      console.log(`⛔ Usuario ${userId} baneado de ${guild.name}`);
    } catch (err) {
      console.warn(`❌ No se pudo banear a ${userId} en ${guild.name}:`, err.message);
    }
  }

  const defaultChannel = guild.channels.cache.find(
    c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages')
  );

  if (defaultChannel && bannedUsers.length > 0) {
    const embed = {
      color: 0xff0000,
      title: '🚨 Protección Antiraid Activada',
      description: `Se han baneado **${bannedUsers.length} usuarios** de la blacklist global.`,
      fields: [
        {
          name: '👥 Usuarios baneados',
          value: bannedUsers.map(u => `• <@${u.id}> (\`${u.tag}\`) - 📝 ${u.reason}`).join('\n'),
        },
      ],
      timestamp: new Date(),
      footer: {
        text: `${process.env.NOMBRE_BOT || 'Bot'} - Seguridad automática activada 🔐`,
      },
    };

    defaultChannel.send({ embeds: [embed] }).catch(() => { });
  }
});

// Evento guildMemberAdd - Ban si está en pendingBans
client.on('guildMemberAdd', async (member) => {
  let pendingBans = {};
  try {
    pendingBans = JSON.parse(await fsp.readFile(pendingBansPath, 'utf8').catch(() => '{}'));
  } catch (e) {
    console.error('❌ Error leyendo pendingBans:', e);
    return;
  }

  const guildId = member.guild.id;
  const userId = member.id;

  if (pendingBans[guildId] && pendingBans[guildId][userId]) {
    const banInfo = pendingBans[guildId][userId];

    try {
      await member.ban({ reason: `Blacklist: ${banInfo.reason}` });
      const embed = EmbedBuilder.from(banInfo.embed);
      const botMember = member.guild.members.me;

      let canal = member.guild.channels.cache.find(c =>
        c.isTextBased() && c.permissionsFor(botMember).has('SendMessages'));

      if (canal) {
        await canal.send({
          content: '@here',
          embeds: [embed],
        });
      }

      delete pendingBans[guildId][userId];
      if (Object.keys(pendingBans[guildId]).length === 0) delete pendingBans[guildId];
      await fsp.writeFile(pendingBansPath, JSON.stringify(pendingBans, null, 2));
      console.log(`✅ ${member.user.tag} baneado automáticamente al entrar en ${member.guild.name}`);
    } catch (e) {
      console.error(`❌ Error baneando a ${member.user.tag} al entrar:`, e);
    }
  }
});

// Slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    if (command.ownerOnly && !isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ No tienes permiso para usar este comando.', ephemeral: true });
    }
    await command.execute(interaction);
  } catch (error) {
    console.error('❌ Error ejecutando comando:', error);
    interaction.reply({ content: '❌ Hubo un error al ejecutar el comando.', ephemeral: true }).catch(() => { });
  }
});

// Acción punitiva con aviso al canal de alertas configurado
async function takePunitiveAction(guild, userId, executor, actionType) {
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member) await member.kick('Expulsado por acción punitiva antiraid.');

    // Ejemplo de eliminar canal y rol (si quieres personalizar borra/edita aquí)
    const raidChannel = guild.channels.cache.find(c => c.name === 'raid-channel');
    if (raidChannel) await raidChannel.delete('Eliminado por acción punitiva.');

    const raidRole = guild.roles.cache.find(r => r.name === 'raid-role');
    if (raidRole) await raidRole.delete('Eliminado por acción punitiva.');

    // Enviar mensaje al canal de alertas configurado
    const alertChannelId = alertConfigCache[guild.id];
    if (!alertChannelId) return;

    const alertChannel = guild.channels.cache.get(alertChannelId);
    if (!alertChannel || !alertChannel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle('🚨 Acción antiraid ejecutada')
      .setDescription(`Se ha expulsado al usuario <@${userId}> y eliminado canales/roles sospechosos.`)
      .addFields([
        { name: 'Ejecutor', value: `<@${executor.id}>`, inline: true },
        { name: 'Tipo de acción', value: actionType, inline: true },
      ])
      .setColor('Red')
      .setTimestamp();

    await alertChannel.send({ embeds: [embed] });
  } catch (e) {
    console.error('❌ Error en acción punitiva:', e);
  }
}

// Comprobar permisos que tiene el bot en cada servidor
async function revisarPermisosBot() {
  for (const [guildId, guild] of client.guilds.cache) {
    const botMember = guild.members.me;
    if (!botMember) continue;
    const perms = botMember.permissions;

    if (!perms.has(PermissionsBitField.Flags.BanMembers) ||
      !perms.has(PermissionsBitField.Flags.KickMembers) ||
      !perms.has(PermissionsBitField.Flags.ManageChannels) ||
      !perms.has(PermissionsBitField.Flags.ManageRoles)) {
      console.warn(`⚠️ El bot no tiene permisos completos en servidor: ${guild.name} (${guild.id})`);
    }
  }
}

// --- Aquí se importa el módulo que maneja los pendientes de ban y le pasamos el client
require('./pendingBanHandler')(client);

// Finalmente, hacer login del bot
client.login(process.env.TOKEN);

// Exportar variables para otros módulos
module.exports = {
  client,
  isOwner,
  whitelistCache,
  alertConfigCache,
  limitsCache,
  blacklistCache,
  blacklistChannelCache,
};
