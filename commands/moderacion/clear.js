const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Borra mensajes del canal')
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad de mensajes a borrar (1-100)').setRequired(true)
    ),
  async execute(interaction) {
    const cantidad = interaction.options.getInteger('cantidad');

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return await interaction.reply({ content: '❌ No tienes permisos para borrar mensajes.', ephemeral: true });
    }

    if (cantidad < 1 || cantidad > 100) {
      return await interaction.reply({ content: '❌ Solo puedes borrar entre 1 y 100 mensajes.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true }); // <- esto previene el error

    await interaction.channel.bulkDelete(cantidad, true);
    await interaction.editReply({ content: `🧹 Se han borrado **${cantidad}** mensajes.` });
  }
};
