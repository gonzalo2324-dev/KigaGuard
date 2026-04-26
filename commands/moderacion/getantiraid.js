const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const botName = process.env.NOMBRE_BOT || 'Bot';
const yelLimitsPath = path.join(__dirname, '../../data/yelLimits.json');

const DEFAULT_LIMITS = {
  crear_canales: 3,
  eliminar_canales: 3,
  editar_canales: 3,
  crear_roles: 3,
  eliminar_roles: 3,
  crear_emojis: 3,
  eliminar_emojis: 3,
  kickear: 3,
  banear: 3,
  desbanear: 3,
};

const DEFAULT_COOLDOWN = 60; // en segundos

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
    .setName('getantiraid')
    .setDescription('Muestra la configuración actual de límites antiraid'),

  async execute(interaction) {
    const guildId = interaction.guild?.id;
    if (!guildId) {
      return interaction.reply({ content: '❌ No se pudo obtener el ID del servidor.', ephemeral: true });
    }

    // Leer archivo o crear objeto vacío
    let data = {};
    if (fs.existsSync(yelLimitsPath)) {
      try {
        const raw = fs.readFileSync(yelLimitsPath, 'utf8');
        data = JSON.parse(raw);
      } catch (err) {
        console.error(`[${botName}] Error leyendo yelLimits.json:`, err);
        return interaction.reply({ content: '❌ Error al leer la configuración del sistema antiraid.', ephemeral: true });
      }
    }

    // Inicializar configuración si no existe
    if (!data[guildId]) {
      data[guildId] = {};
    }

    let needSave = false;

    // Asegurar que todas las funciones tengan límite y cooldown válidos
    for (const key of Object.keys(DEFAULT_LIMITS)) {
      if (!data[guildId][key]) {
        data[guildId][key] = { limite: DEFAULT_LIMITS[key], cooldown: DEFAULT_COOLDOWN };
        needSave = true;
      } else {
        if (typeof data[guildId][key] === 'number') {
          data[guildId][key] = { limite: data[guildId][key], cooldown: DEFAULT_COOLDOWN };
          needSave = true;
        } else {
          if (typeof data[guildId][key].limite !== 'number') {
            data[guildId][key].limite = DEFAULT_LIMITS[key];
            needSave = true;
          }
          if (typeof data[guildId][key].cooldown !== 'number') {
            data[guildId][key].cooldown = DEFAULT_COOLDOWN;
            needSave = true;
          }
        }
      }
    }

    if (needSave) {
      try {
        fs.writeFileSync(yelLimitsPath, JSON.stringify(data, null, 2), 'utf8');
      } catch (err) {
        console.error(`[${botName}] Error guardando yelLimits.json:`, err);
      }
    }

    const config = data[guildId];

    // Crear embed con la configuración
    const embed = new EmbedBuilder()
      .setTitle(`🛡️ Configuración Anti-Raid ${botName}`)
      .setColor('#ff0000')
      .setTimestamp()
      .setFooter({ text: botName, iconURL: interaction.client.user.displayAvatarURL() });

    let descripcion = '';

    for (const [funcion, obj] of Object.entries(config)) {
      const nombreFuncion = FUNCION_NAMES[funcion] || capitalize(funcion);
      const limite = typeof obj.limite === 'number' ? obj.limite : DEFAULT_LIMITS[funcion] || 3;
      const cooldown = typeof obj.cooldown === 'number' ? obj.cooldown : DEFAULT_COOLDOWN;

      descripcion += `🔸 **${nombreFuncion}**\n`;
      descripcion += `   • Límite: \`${limite}\` acciones antes de sanción\n`;
      descripcion += `   • Cooldown: \`${cooldown}\` segundos para reiniciar el conteo\n\n`;
    }

    embed.setDescription(descripcion);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
