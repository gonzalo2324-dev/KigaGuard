const { EmbedBuilder, Events, ChannelType, PermissionsBitField } = require('discord.js');

const botName = process.env.NOMBRE_BOT || 'Bot';

module.exports = {
  name: Events.GuildCreate,

  async execute(guild) {
    console.log(`🔔 Me uní a un nuevo servidor: ${guild.name}`);

    const defaultChannel = guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildText &&
        channel.permissionsFor(guild.members.me)?.has(PermissionsBitField.Flags.SendMessages)
    );

    if (defaultChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`🛡️ ¡Gracias por invitar a ${botName}!`)
        .setDescription(
          `Gracias por confiar en **${botName}**, tu bot de seguridad y protección contra raids y bots.\n\n` +
          '👮 Usa `/antiraid`, `/verificacion`, y más comandos para configurar la protección.\n\n' +
          '📘 Si necesitas ayuda, únete a nuestro servidor de soporte:\n' +
          'https://discord.gg/4txrNTwdKP'
        )
        .setColor('Blue')
        .setFooter({ text: `${botName} – Protección activa` })
        .setTimestamp();

      await defaultChannel.send({ embeds: [embed] }).catch(() => {});
    }
  }
};
