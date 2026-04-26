const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const spamConfigPath = path.join(__dirname, '..', '..', 'data', 'spamConfig.json');
const whitelistPath = path.join(__dirname, '..', '..', 'data', 'whitelistData.json');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurar-spam')
    .setDescription('Configura el sistema antispam del servidor (solo owner)')
    .addStringOption(option =>
      option.setName('funcion')
        .setDescription('Qué quieres configurar')
        .setRequired(true)
        .addChoices(
          { name: 'habilitar', value: 'habilitar' },
          { name: 'deshabilitar', value: 'deshabilitar' },
          { name: 'tiempo_reseteo', value: 'tiempo_reseteo' },
          { name: 'max_mensajes', value: 'max_mensajes' },
          { name: 'tiempo_aislamiento', value: 'tiempo_aislamiento' },
          { name: 'warn_role', value: 'warn_role' },
          { name: 'warn_limit', value: 'warn_limit' },
        ))
    .addStringOption(option =>
      option.setName('valor')
        .setDescription('Valor para la configuración')
        .setRequired(false)),

  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: '⛔ Solo el dueño del servidor puede usar este comando.', ephemeral: true });
    }

    const guildId = interaction.guild.id;
    const funcion = interaction.options.getString('funcion');
    const valor = interaction.options.getString('valor');

    let spamConfig = readJSON(spamConfigPath);
    if (!spamConfig[guildId]) {
      spamConfig[guildId] = {
        enabled: false,
        resetTime: 3,
        maxMessages: 3,
        isolationTime: 60,
        warnRoleId: null,
        warnLimit: 3,
        usersData: {},
      };
    }

    const serverConfig = spamConfig[guildId];

    switch (funcion) {
      case 'habilitar':
        serverConfig.enabled = true;
        await interaction.reply(`✅ Sistema antispam habilitado en ${process.env.NOMBRE_BOT || 'Bot'}.`);
        break;
      case 'deshabilitar':
        serverConfig.enabled = false;
        await interaction.reply(`❌ Sistema antispam deshabilitado en ${process.env.NOMBRE_BOT || 'Bot'}.`);
        break;
      case 'tiempo_reseteo':
        if (!valor || isNaN(valor)) return interaction.reply('⛔ Debes indicar un número válido de segundos.');
        serverConfig.resetTime = Number(valor);
        await interaction.reply(`🕒 Tiempo de reseteo establecido en ${valor} segundos.`);
        break;
      case 'max_mensajes':
        if (!valor || isNaN(valor)) return interaction.reply('⛔ Debes indicar un número válido de mensajes.');
        serverConfig.maxMessages = Number(valor);
        await interaction.reply(`💬 Límite de mensajes configurado en ${valor}.`);
        break;
      case 'tiempo_aislamiento':
        if (!valor || isNaN(valor)) return interaction.reply('⛔ Debes indicar un número válido de segundos.');
        serverConfig.isolationTime = Number(valor);
        await interaction.reply(`🚷 Tiempo de aislamiento establecido en ${valor} segundos.`);
        break;
      case 'warn_role':
        if (!valor) return interaction.reply('⛔ Debes indicar el ID del rol de advertencia.');
        if (!interaction.guild.roles.cache.has(valor)) return interaction.reply('⛔ Ese rol no existe en el servidor.');
        serverConfig.warnRoleId = valor;
        await interaction.reply(`⚠️ Rol de advertencias actualizado correctamente.`);
        break;
      case 'warn_limit':
        if (!valor || isNaN(valor)) return interaction.reply('⛔ Debes indicar un número válido para el límite de advertencias.');
        serverConfig.warnLimit = Number(valor);
        await interaction.reply(`📌 Límite de advertencias establecido en ${valor}.`);
        break;
      default:
        return interaction.reply('⛔ Opción no válida.');
    }

    spamConfig[guildId] = serverConfig;
    saveJSON(spamConfigPath, spamConfig);
  }
};
