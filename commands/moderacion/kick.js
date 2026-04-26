const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsar a un usuario del servidor')
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón del kick')
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply({ content: '❌ No tienes permisos para expulsar usuarios.', ephemeral: true });
    }

    const user = interaction.options.getUser('usuario');
    const razon = interaction.options.getString('razon') || 'Sin razón';

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) return interaction.reply({ content: '❌ Usuario no encontrado en el servidor.', ephemeral: true });

    try {
      await member.kick(razon);
      interaction.reply(`👢 El usuario **${user.tag}** ha sido expulsado.\n📄 Razón: ${razon}`);
    } catch (err) {
      interaction.reply({ content: '❌ Error al expulsar al usuario.', ephemeral: true });
    }
  }
};
