const { 
  SlashCommandBuilder, 
  PermissionsBitField, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');

const { readConfig, saveConfig } = require('../../utils/configHandler');
require('dotenv').config();
const botName = process.env.NOMBRE_BOT || 'Bot';
const OWNERS = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [];
function isOwner(userId) {
  return OWNERS.includes(userId);
}


module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificacion')
    .setDescription('Configura la verificación del servidor.')
    .addRoleOption(option =>
      option.setName('rol_no_verificado')
        .setDescription('Rol para usuarios no verificados')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('rol_verificado')
        .setDescription('Rol para usuarios verificados')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('canal_verificacion')
        .setDescription('Canal donde se mostrará el mensaje de verificación')
        .setRequired(true)),
  
  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    // ✅ Permitir solo administradores o owners
    if (
      !member.permissions.has(PermissionsBitField.Flags.Administrator) &&
      !isOwner(interaction.user.id)
    ) {
      return interaction.reply({
        content: '❌ Necesitas permisos de administrador o ser owner para usar este comando.',
        ephemeral: true
      });
    }

    const rolNoVerificado = interaction.options.getRole('rol_no_verificado');
    const rolVerificado = interaction.options.getRole('rol_verificado');
    const canalVerificacion = interaction.options.getChannel('canal_verificacion');

    // 📌 Guardar config por servidor
    saveConfig(interaction.guild.id, {
      rolNoVerificadoId: rolNoVerificado.id,
      rolVerificadoId: rolVerificado.id,
      canalVerificacionId: canalVerificacion.id
    });

    // Cambiar permisos en canales
    interaction.guild.channels.cache.forEach(channel => {
      if (channel.isTextBased() || channel.isVoiceBased()) {
        if (channel.id === canalVerificacion.id) {
          channel.permissionOverwrites.edit(rolNoVerificado, {
            ViewChannel: true,
            SendMessages: false,
            ReadMessageHistory: true,
            AddReactions: false,
            Connect: true,
            Speak: false
          }).catch(console.error);
        } else {
          channel.permissionOverwrites.edit(rolNoVerificado, {
            ViewChannel: false,
            SendMessages: false,
            ReadMessageHistory: false,
            AddReactions: false,
            Connect: false,
            Speak: false
          }).catch(console.error);
        }
      }
    });

    // Botón de verificación
    const boton = new ButtonBuilder()
      .setCustomId('verificarme')
      .setLabel('✅ Verificarme')
      .setStyle(ButtonStyle.Success);

    const fila = new ActionRowBuilder().addComponents(boton);

    // Mensaje de verificación
    const embedVerificacion = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🔒 ¡Bienvenido al servidor!')
      .setDescription(
        `Para acceder a todas las funciones y canales, necesitas completar la verificación.\n\n` +
        `Presiona el botón **"Verificarme"** para iniciar el proceso. Esto nos ayuda a mantener la comunidad segura y libre de bots.\n\n` +
        `¡Gracias por formar parte de esta comunidad!`
      )
      .setFooter({ text: `Sistema de Verificación • ${botName}` })
      .setTimestamp();

    await canalVerificacion.send({ embeds: [embedVerificacion], components: [fila] });

    await interaction.reply({ content: '✅ Verificación configurada correctamente.', ephemeral: true });
  }
};
