const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const yelLimitsPath = path.join(__dirname, '../../data/yelLimits.json');

const FUNCION_NAMES = {
  crear_canales: 'Crear canales',
  eliminar_canales: 'Eliminar canales',
  editar_canales: 'Editar canales',
  crear_roles: 'Crear roles',
  eliminar_roles: 'Eliminar roles',
  crear_emojis: 'Crear emojis',
  eliminar_emojis: 'Eliminar emojis',
  kickear: 'Kickear',
  banear: 'Banear',
  desbanear: 'Desbanear',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configura límites de acciones peligrosas (borrar canales, roles, expulsar, etc.)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('funcion')
        .setDescription('Acción a limitar')
        .setRequired(true)
        .addChoices(
          { name: 'Crear canales', value: 'crear_canales' },
          { name: 'Eliminar canales', value: 'eliminar_canales' },
          { name: 'Editar canales', value: 'editar_canales' },
          { name: 'Crear roles', value: 'crear_roles' },
          { name: 'Eliminar roles', value: 'eliminar_roles' },
          { name: 'Crear emojis', value: 'crear_emojis' },
          { name: 'Eliminar emojis', value: 'eliminar_emojis' },
          { name: 'Kickear', value: 'kickear' },
          { name: 'Banear', value: 'banear' },
          { name: 'Desbanear', value: 'desbanear' }
        ))
    .addIntegerOption(option =>
      option.setName('limite')
        .setDescription('Límite antes de banear (por defecto: 3)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('cooldown')
        .setDescription('Tiempo de reinicio del límite en segundos (por defecto: 60)')
        .setRequired(false)),

  async execute(interaction) {
    const funcion = interaction.options.getString('funcion');
    let limite = interaction.options.getInteger('limite');
    let cooldown = interaction.options.getInteger('cooldown');

    if (!limite || limite < 1) limite = 3;
    if (!cooldown || cooldown < 5) cooldown = 60;

    const guildId = interaction.guild.id;

    let data = {};
    try {
      if (fs.existsSync(yelLimitsPath)) {
        data = JSON.parse(fs.readFileSync(yelLimitsPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error leyendo yelLimits.json:', error);
      return interaction.reply({ content: '❌ Error leyendo la configuración.', ephemeral: true });
    }

    if (!data[guildId]) data[guildId] = {};
    data[guildId][funcion] = {
      limite,
      cooldown
    };

    try {
      fs.writeFileSync(yelLimitsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error guardando yelLimits.json:', error);
      return interaction.reply({ content: '❌ Error guardando la configuración.', ephemeral: true });
    }

    await interaction.reply({
      content: `✅ Se ha actualizado **${FUNCION_NAMES[funcion] || funcion}**:\n• Límite: \`${limite}\` acciones\n• Cooldown: \`${cooldown}\` segundos entre resets.`,
      ephemeral: true
    });
  },

  ownerOnly: false,
};
