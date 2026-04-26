const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const path = require('path');
const fs = require('fs');

const botName = process.env.NOMBRE_BOT || 'Bot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check')
    .setDescription('Realiza una comprobación de seguridad del servidor'),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: 'Este comando solo funciona en servidores.', ephemeral: true });

    const alertConfigPath = path.join(__dirname, '..', '..', 'data', 'alertConfig.json');
    const blacklistConfigPath = path.join(__dirname, '..', '..', 'data', 'blacklistChannel.json');

    let alertConfig = {};
    let blacklistConfig = {};

    try {
      alertConfig = JSON.parse(fs.readFileSync(alertConfigPath, 'utf8'));
    } catch (e) {
      console.error('Error cargando alertConfig.json:', e);
    }

    try {
      blacklistConfig = JSON.parse(fs.readFileSync(blacklistConfigPath, 'utf8'));
    } catch (e) {
      console.error('Error cargando blacklistChannel.json:', e);
    }

    const alertChannelId = alertConfig[guild.id];
    const blacklistChannelId = blacklistConfig[guild.id];

    const alertChannel = alertChannelId ? guild.channels.cache.get(alertChannelId) : null;
    const blacklistChannel = blacklistChannelId ? guild.channels.cache.get(blacklistChannelId) : null;

    const botMember = guild.members.me;
    const botHighestRole = botMember.roles.highest;
    const guildHighestRole = guild.roles.cache.reduce((prev, role) =>
      role.position > prev.position ? role : prev, botHighestRole);

    const isBotRoleFirst = botHighestRole.id === guildHighestRole.id;
    const hasAdminPerm = botMember.permissions.has(PermissionsBitField.Flags.Administrator);

    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const botAvatarURL = interaction.client.user.displayAvatarURL({ extension: 'png', size: 128 });

    const embed = new EmbedBuilder()
      .setColor(isBotRoleFirst && hasAdminPerm ? '#00ff00' : '#ffcc00')
      .setTitle(`🛡️ Comprobación de Seguridad - ${botName}`)
      .setDescription(hasAdminPerm ? (isBotRoleFirst ? '✅ Todo configured correctly.' : '⚠️ El rol del bot debería estar más alto.') : '⚠️ Faltan permisos de administrador.')
      .addFields([
        { name: '📢 Canal de alertas', value: alertChannel ? `<#${alertChannel.id}>` : '❌ No configurado', inline: true },
        { name: '📋 Canal blacklist', value: blacklistChannel ? `<#${blacklistChannel.id}>` : '❌ No configurado', inline: true },
        { name: '⚙️ Estado', value: isBotRoleFirst && hasAdminPerm ? '✅ Óptimo' : '⚠️ Revisar', inline: true },
        { name: '📝 Recomendaciones', value: `• Asegúrate de tener configurados los canales.\n• El rol de ${botName} debe estar encima.\n• Es preferible otorgar permisos de Administrador.` }
      ])
      .setFooter({ text: `${botName} • Solicitado por ${interaction.user.tag} • ${time}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};