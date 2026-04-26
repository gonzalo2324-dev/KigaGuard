const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment');

const botName = process.env.NOMBRE_BOT || 'Bot';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('estado-bot')
    .setDescription('📊 Muestra estadísticas detalladas del bot'),

  async execute(interaction) {
    const { client } = interaction;

    // ✅ Avisamos a Discord que estamos procesando
    await interaction.deferReply();

    let totalUsers = 0;
    let monitoredServers = 0;

    for (const [, guild] of client.guilds.cache) {
      totalUsers += guild.memberCount || 0;
      monitoredServers++;
    }

    const uptime = moment.duration(client.uptime).humanize();
    const lastRestart = `<t:${Math.floor(client.readyTimestamp / 1000)}:F>`;
    const totalCommands = client.commands?.size || 0;
    const totalChannels = client.channels.cache.size;
    const createdAt = `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`;
    const botVersion = '1.07.0';
    const botTag = client.user.tag;

    const animatedEmojis = client.emojis.cache.filter(e => e.animated).size;
    const staticEmojis = client.emojis.cache.size - animatedEmojis;

    const inviteLink = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot+applications.commands&permissions=8`;

    const embed = new EmbedBuilder()
      .setColor(0x2C2F33)
.setTitle(`🛡️ • Estado actual de ${botName}`)
      .setDescription(`
╭━━━💙🩵━━━╮
┃ ¡Hola! Soy **${botName}**, tu guardián digital de servidores 🛡️🕵️‍♂️
┃ Aquí tienes mis estadísticas actuales:
╰━━━━━━━━━━━━╯
      `)
      .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
      .addFields(
        { name: '🌐 Estado del Bot', value: '🟢 En línea', inline: true },
        { name: '⏳ Tiempo activo', value: `🕒 ${uptime}`, inline: true },
        { name: '📅 Último reinicio', value: `🔄 ${lastRestart}`, inline: true },
        {
          name: '🌐 Cobertura Global',
          value: `• 🧭 **${monitoredServers}** servidores\n• 👥 **${totalUsers.toLocaleString()}** usuarios\n• 💬 **${totalChannels}** canales`,
          inline: false
        },
        { name: '🤖 Comandos registrados', value: `⌨️ ${totalCommands}`, inline: true },
        { name: '📅 Fecha de creación', value: createdAt, inline: true },
        { name: '📦 Versión', value: `\`v${botVersion}\``, inline: true },
        { name: '🤖 Nombre', value: botTag, inline: true },
        {
          name: '😄 Emojis cargados',
          value: `✨ ${animatedEmojis} animados\n⚪ ${staticEmojis} estáticos`,
          inline: true
        },
        {
          name: '🔗 Enlaces útiles',
          value: `[📨 Invítame](${inviteLink}) • [💬 Soporte](https://discord.gg/4txrNTwdKP)`,
          inline: false
        }
      )
      .setFooter({
        text: `🔍 Solicitado por ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    const supportButton = new ButtonBuilder()
      .setLabel('💬 Servidor de Soporte')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/4txrNTwdKP');

    const inviteButton = new ButtonBuilder()
      .setLabel('📨 Invítame')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteLink);

    const row = new ActionRowBuilder().addComponents(supportButton, inviteButton);

    // ✅ Usamos editReply en lugar de reply
    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
