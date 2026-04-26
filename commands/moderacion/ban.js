const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banear o desbanear a un usuario del servidor')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Banear a un usuario')
        .addUserOption(opt =>
          opt.setName('usuario').setDescription('Usuario a banear').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('razon').setDescription('Razón del baneo')
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Desbanear a un usuario')
        .addStringOption(opt =>
          opt.setName('id').setDescription('ID del usuario a desbanear').setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }

    if (subcommand === 'add') {
      const user = interaction.options.getUser('usuario');
      const razon = interaction.options.getString('razon') || 'Sin razón';

      try {
        await interaction.guild.members.ban(user.id, { reason: razon });
        interaction.reply(`✅ El usuario **${user.tag}** ha sido baneado.\n📄 Razón: ${razon}`);
      } catch (err) {
        interaction.reply({ content: '❌ Error al banear al usuario.', ephemeral: true });
      }

    } else if (subcommand === 'remove') {
      const id = interaction.options.getString('id');

      try {
        await interaction.guild.members.unban(id);
        interaction.reply(`✅ El usuario con ID **${id}** ha sido desbaneado.`);
      } catch (err) {
        interaction.reply({ content: '❌ No se pudo desbanear al usuario. Verifica el ID.', ephemeral: true });
      }
    }
  }
};
