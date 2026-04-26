const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const ownerIDs = process.env.OWNERS?.split(',') || [];

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

const crearEmbed = (user, reason, modTag, tipo, imageUrl = null) => {
  const embed = new EmbedBuilder()
    .setTitle('🚫 Usuario Baneado Globalmente')
    .setColor('#000000')
    .addFields(
      { name: '👤 Usuario', value: `${user.tag} \n\`${user.id}\`` },
      { name: '📌 Tipo', value: tipo, inline: true },
      { name: '📝 Motivo', value: reason, inline: true },
      { name: '🧑 Moderador', value: modTag }
    )
    .setTimestamp();

  if (imageUrl) embed.setImage(imageUrl);
  return embed;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklistadd')
    .setDescription('Agrega un usuario a la blacklist (solo owners).')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a agregar a la blacklist')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón para agregar a la blacklist')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de baneo')
        .addChoices(
          { name: 'Indefinido', value: 'Indefinida' },
          { name: 'Temporal', value: 'Temporal' }
        )
        .setRequired(false))
    .addStringOption(option =>
      option.setName('imagen')
        .setDescription('URL de una imagen de evidencia o prueba')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('avisar')
        .setDescription('¿Quieres enviar un aviso por MD al usuario?')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!ownerIDs.includes(interaction.user.id)) {
      return interaction.editReply({ content: '🚫 Este comando es solo para los dueños del bot.' });
    }

    const user = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'Sin razón especificada';
    const tipo = interaction.options.getString('tipo') || 'Indefinida';
    const imagen = interaction.options.getString('imagen'); // URL de la imagen
    const avisar = interaction.options.getBoolean('avisar') ?? true; // por defecto sí

    if (ownerIDs.includes(user.id)) {
      return interaction.editReply({ content: '🚫 No puedes agregar a un owner a la blacklist.' });
    }

    const blacklistPath = path.join(__dirname, '../../data/blacklist.json');
    const channelConfigPath = path.join(__dirname, '../../data/blacklistChannel.json');
    const pendingBansPath = path.join(__dirname, '../../data/pendingBans.json');

    const blacklist = await readJson(blacklistPath);
    const blacklistChannels = await readJson(channelConfigPath);
    const pendingBans = await readJson(pendingBansPath);

    if (blacklist[user.id]) {
      return interaction.editReply({ content: `⚠️ El usuario ${user.tag} ya está en la blacklist.` });
    }

    blacklist[user.id] = {
      tag: user.tag,
      addedAt: new Date().toISOString(),
      reason,
      tipo,
      image: imagen || null
    };

    try {
      await writeJson(blacklistPath, blacklist);
    } catch (err) {
      console.error('❌ Error guardando blacklist:', err);
      return interaction.editReply({ content: '❌ Error guardando blacklist.' });
    }

    const embed = crearEmbed(user, reason, interaction.user.tag, tipo, imagen);
    const client = interaction.client;
    let baneosExitosos = 0;
    let baneosFallidos = 0;

    const serverSoporteID = '769512521555771398';

    for (const [guildId, guild] of client.guilds.cache) {
      if (guildId === serverSoporteID) {
        console.log(`⛔ Saltando servidor de soporte (${guild.name})`);
        continue;
      }

      try {
        const botMember = guild.members.me;
        if (!botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          console.log(`⚠️ Sin permisos de ban en ${guild.name}`);
          baneosFallidos++;
          continue;
        }

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
          // ❌ Evitar agregar pendingBans en el servidor de soporte
          if (!pendingBans[guildId]) pendingBans[guildId] = {};
          if (!pendingBans[guildId][user.id]) {
            pendingBans[guildId][user.id] = {
              tag: user.tag,
              reason,
              tipo,
              image: imagen || null,
              embed: embed.toJSON(),
            };
            console.log(`📥 ${user.tag} agregado a pendingBans para ${guild.name}`);
          }
          continue;
        }

        await guild.members.ban(user.id, { reason: `Agregado a blacklist: ${reason}` });
        baneosExitosos++;
        console.log(`✅ ${user.tag} baneado en ${guild.name}`);

        const canalIdConfig = blacklistChannels[guildId];
        if (canalIdConfig) {
          const canal = guild.channels.cache.get(canalIdConfig);
          if (canal && canal.isTextBased() && canal.permissionsFor(botMember).has(PermissionsBitField.Flags.SendMessages)) {
            await canal.send({
              content: '@here',
              embeds: [embed],
            });
          }
        }

      } catch (error) {
        console.error(`❌ Error baneando a ${user.tag} en ${guild.name}:`, error);
        baneosFallidos++;
      }
    }

    await writeJson(pendingBansPath, pendingBans);

    // ✅ Avisar al usuario por MD solo si se pidió
    if (avisar) {
      try {
        const dmEmbed = crearEmbed(user, reason, interaction.user.tag, tipo, imagen);
        await user.send({ embeds: [dmEmbed] });
      } catch (err) {
        console.warn(`⚠️ No se pudo enviar DM a ${user.tag}.`, err.message);
      }
    }

    return interaction.editReply(`✅ Usuario ${user.tag} baneado globalmente.\n📌 Servidores OK: ${baneosExitosos}\n⚠️ Fallos: ${baneosFallidos}`);
  },
};
