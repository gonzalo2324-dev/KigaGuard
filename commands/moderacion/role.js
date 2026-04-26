const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const owners = process.env.OWNERS ? process.env.OWNERS.split(',') : [];

function isOwner(userId) {
  return owners.includes(userId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Agregar o quitar un rol')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Agregar un rol a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        .addRoleOption(opt => opt.setName('rol').setDescription('Rol a dar').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Quitar un rol a un usuario')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        .addRoleOption(opt => opt.setName('rol').setDescription('Rol a quitar').setRequired(true))
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildOwnerId = interaction.guild.ownerId;

    if (!isOwner(userId) && userId !== guildOwnerId) {
      return interaction.reply({
        content: '❌ Solo el owner del servidor o los owners globales pueden usar este comando.',
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getMember('usuario');
    const rol = interaction.options.getRole('rol');

    if (!user || !rol) {
      return interaction.reply({ content: '❌ Usuario o rol no encontrado.', ephemeral: true });
    }

    try {
      if (sub === 'add') {
        await user.roles.add(rol);
        interaction.reply(`✅ Rol **${rol.name}** añadido a **${user.user.tag}**`);
      } else {
        await user.roles.remove(rol);
        interaction.reply(`✅ Rol **${rol.name}** quitado de **${user.user.tag}**`);
      }
    } catch (err) {
      console.error('❌ Error modificando roles:', err);
      interaction.reply({ content: '❌ Error al modificar el rol. Revisa los permisos del bot.', ephemeral: true });
    }
  }
};
