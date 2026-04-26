const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'alertConfig.json');

function readConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-alert-channel')
    .setDescription('Configura el canal para enviar alertas de eliminación de canales (solo dueño)')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal de texto para alertas')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText) // Solo canales de texto
    ),

  async execute(interaction) {
    // Verificación de propietario
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: '❌ Solo el dueño puede usar este comando.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('canal');

    const config = readConfig();
    config[interaction.guild.id] = channel.id;
    saveConfig(config);

    await interaction.reply(`✅ Canal de alertas configurado: ${channel}`);
  },
};
