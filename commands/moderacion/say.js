const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const whitelistPath = path.join(__dirname, '..', '..', 'data', 'whitelistData.json');

function getWhitelist(guildId) {
  try {
    if (fs.existsSync(whitelistPath)) {
      const data = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
      return data[guildId] || { whitelistRoles: [], whitelistUsers: [] };
    }
  } catch (e) {
    console.error('Error leyendo whitelist:', e);
  }
  return { whitelistRoles: [], whitelistUsers: [] };
}

const owners = process.env.OWNERS ? process.env.OWNERS.split(',') : [];

function isOwner(userId) {
  return owners.includes(userId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Envía un mensaje oficial con color personalizado')
    .addStringOption(option =>
      option.setName('mensaje')
        .setDescription('Mensaje a enviar')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Color hexadecimal de la barra lateral (ej: #ff0000)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('titulo')
        .setDescription('Título opcional del embed')
        .setRequired(false)
    ),

  async execute(interaction) {
    const { guild, member, user, channel } = interaction;
    if (!guild) {
      return interaction.reply({ content: '❌ Este comando solo se puede usar en un servidor.', ephemeral: true });
    }

    const whitelist = getWhitelist(guild.id);

    const isWhitelistUser = whitelist.whitelistUsers.includes(user.id);
    const hasWhitelistRole = member.roles.cache.some(r => whitelist.whitelistRoles.includes(r.id));
    const isGuildOwner = user.id === guild.ownerId;
    const isBotOwner = isOwner(user.id);

    if (!(isWhitelistUser || hasWhitelistRole || isGuildOwner || isBotOwner)) {
      return interaction.reply({ content: '❌ No tienes permiso para usar este comando.', ephemeral: true });
    }

    const mensaje = interaction.options.getString('mensaje');
    let color = interaction.options.getString('color') || '#0099ff';
    const titulo = interaction.options.getString('titulo') || null;

    if (!/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      await interaction.reply({ content: '⚠️ El color proporcionado no es válido. Se usará el color por defecto.', ephemeral: true });
      color = '#0099ff';
    }

    if (!channel.permissionsFor(guild.members.me).has('EmbedLinks')) {
      return interaction.reply({ content: '❌ No tengo permisos para enviar embeds en este canal.', ephemeral: true });
    }

    try {
      const embed = new EmbedBuilder()
        .setDescription(mensaje)
        .setColor(color)
        .setFooter({ text: `Mensaje enviado por ${user.tag}`, iconURL: user.displayAvatarURL() });

      if (titulo) embed.setTitle(titulo);

      await channel.send({ embeds: [embed] });

      await interaction.reply({ content: '✅ Mensaje enviado.', ephemeral: true });

      // Opcional: log en consola
      console.log(`[say] ${user.tag} envió un mensaje en ${guild.name}: "${mensaje}"`);
    } catch (error) {
      console.error('Error al enviar mensaje say:', error);
      await interaction.reply({ content: '❌ Ocurrió un error al enviar el mensaje.', ephemeral: true });
    }
  },
};
