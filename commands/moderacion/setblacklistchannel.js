const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Cargar variables de entorno

// ✅ Función para verificar owners usando .env
const OWNERS = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [];
function isOwner(userId) {
  return OWNERS.includes(userId);
}

const blacklistChannelPath = path.join(__dirname, '../../data/blacklistChannel.json');

function readBlacklistChannels() {
  if (!fs.existsSync(blacklistChannelPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(blacklistChannelPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveBlacklistChannels(data) {
  fs.writeFileSync(blacklistChannelPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setblacklistchannel')
    .setDescription('Configura el canal donde se enviarán las alertas de blacklist.')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal de texto para enviar las alertas')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Permitir solo administradores o owners
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
      !isOwner(interaction.user.id)
    ) {
      return interaction.reply({ content: '❌ Necesitas permisos de administrador o ser owner para usar este comando.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('canal');

    if (!channel.isTextBased()) {
      return interaction.reply({ content: '❌ Por favor, selecciona un canal de texto válido.', ephemeral: true });
    }

    const blacklistChannels = readBlacklistChannels();
    blacklistChannels[interaction.guild.id] = channel.id;

    try {
      saveBlacklistChannels(blacklistChannels);
      return interaction.reply({ content: `✅ Canal de alertas de blacklist configurado a ${channel}.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '❌ Error guardando la configuración.', ephemeral: true });
    }
  },
};
