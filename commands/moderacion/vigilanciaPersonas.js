const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'monitorearPersonasConfig.json');

async function cargarConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data || '{}');
  } catch {
    return {};
  }
}

async function guardarConfig(config) {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('monitorearpersonas')
    .setDescription('Configura qué personas quieres monitorear')
    .addStringOption(option =>
      option.setName('opcion')
        .setDescription('¿Qué quieres hacer?')
        .setRequired(true)
        .addChoices(
          { name: 'Elegir persona', value: 'elegir' },
          { name: 'Eliminar persona', value: 'eliminar' },
          { name: 'Ver personas vigiladas', value: 'ver' },
          { name: 'Habilitar sistema', value: 'habilitar' },
          { name: 'Desactivar sistema', value: 'desactivar' }
        )
    )
    .addUserOption(option =>
      option.setName('persona')
        .setDescription('Persona a vigilar o eliminar')
        .setRequired(false)
    ),

  async execute(interaction) {
    const opcion = interaction.options.getString('opcion');
    const personaTarget = interaction.options.getUser('persona');
    const guildId = interaction.guild.id;

    let config = await cargarConfig();
    if (!config[guildId]) config[guildId] = { activos: false, personas: [] };

    const servidor = config[guildId];

    switch (opcion) {
      case 'elegir': {
        if (!personaTarget) {
          return interaction.reply({ content: '❌ Debes mencionar una **persona válida** para vigilar.', ephemeral: true });
        }

        if (servidor.personas.includes(personaTarget.id)) {
          return interaction.reply({ content: '⚠️ Esta persona **ya está siendo vigilada**.', ephemeral: true });
        }

        if (servidor.personas.length >= 5) {
          return interaction.reply({ content: '❌ Solo puedes vigilar hasta **5 personas**. Elimina una antes.', ephemeral: true });
        }

        servidor.personas.push(personaTarget.id);
        servidor.activos = true;
        await guardarConfig(config);
        return interaction.reply({ content: `✅ Ahora se está **vigilando a la persona**: **${personaTarget.tag}**.`, ephemeral: true });
      }

      case 'eliminar': {
        if (!personaTarget || !servidor.personas.includes(personaTarget.id)) {
          return interaction.reply({ content: '❌ Esa persona **no está en la lista de vigilancia**.', ephemeral: true });
        }

        servidor.personas = servidor.personas.filter(id => id !== personaTarget.id);
        await guardarConfig(config);
        return interaction.reply({ content: `🗑️ La persona **${personaTarget.tag}** ha sido **eliminada de la lista de vigilancia**.`, ephemeral: true });
      }

      case 'ver': {
        if (servidor.personas.length === 0) {
          return interaction.reply({ content: '📭 No hay personas siendo vigiladas actualmente.', ephemeral: true });
        }

        const lista = servidor.personas.map((id, i) => `${i + 1}. <@${id}> \`(${id})\``).join('\n');
        return interaction.reply({ content: `📋 **Personas vigiladas actualmente:**\n${lista}`, ephemeral: true });
      }

      case 'desactivar': {
        config[guildId] = { activos: false, personas: [] };
        await guardarConfig(config);
        return interaction.reply({ content: '🚫 El sistema ha sido **desactivado y reiniciado**.', ephemeral: true });
      }

      case 'habilitar': {
        if (servidor.personas.length === 0) {
          return interaction.reply({ content: '⚠️ No hay personas configuradas para vigilar. Usa la opción **"elegir"** primero.', ephemeral: true });
        }

        servidor.activos = true;
        await guardarConfig(config);
        return interaction.reply({ content: '✅ El sistema ha sido **habilitado nuevamente**.', ephemeral: true });
      }

      default:
        return interaction.reply({ content: '❌ Opción no válida.', ephemeral: true });
    }
  }
};
