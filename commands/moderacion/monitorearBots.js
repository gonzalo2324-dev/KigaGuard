const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'data', 'antiBotConfig.json');

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

async function intentarEnviarDM(user, contenido) {
  try {
    await user.send(contenido);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('monitorearbots')
    .setDescription('Configura qué bots quieres monitorear')
    .addStringOption(option =>
      option.setName('opcion')
        .setDescription('¿Qué quieres hacer?')
        .setRequired(true)
        .addChoices(
          { name: 'Elegir bot', value: 'elegir' },
          { name: 'Eliminar bot', value: 'eliminar' },
          { name: 'Ver bots vigilados', value: 'ver' },
          { name: 'Habilitar sistema', value: 'habilitar' },
          { name: 'Desactivar sistema', value: 'desactivar' }
        )
    )
    .addUserOption(option =>
      option.setName('bot')
        .setDescription('Bot a vigilar o eliminar')
        .setRequired(false)
    ),

  async execute(interaction) {
    const opcion = interaction.options.getString('opcion');
    const botTarget = interaction.options.getUser('bot');
    const guildId = interaction.guild.id;

    let config = await cargarConfig();
    if (!config[guildId]) config[guildId] = { activos: false, bots: [] };

    const servidor = config[guildId];

    switch (opcion) {
      case 'elegir': {
        if (!botTarget || !botTarget.bot) {
          return interaction.reply({ content: '❌ Debes mencionar un **bot válido** para vigilar.', ephemeral: true });
        }

        if (servidor.bots.includes(botTarget.id)) {
          return interaction.reply({ content: '⚠️ Este bot **ya está siendo vigilado**.', ephemeral: true });
        }

        if (servidor.bots.length >= 3) {
          return interaction.reply({ content: '❌ Solo puedes vigilar hasta **3 bots**. Elimina uno antes.', ephemeral: true });
        }

        servidor.bots.push(botTarget.id);
        servidor.activos = true;
        await guardarConfig(config);

        const dmEnviado = await intentarEnviarDM(botTarget, `Hola! Has sido agregado a la lista de bots vigilados en el servidor **${interaction.guild.name}**.`);

        return interaction.reply({
          content: `✅ Ahora se está **vigilando al bot**: **${botTarget.tag}**.\n` +
                   (dmEnviado ? '✉️ Se pudo enviar un DM al bot.' : '⚠️ No se pudo enviar DM al bot.')
          ,
          ephemeral: true
        });
      }

      case 'eliminar': {
        if (!botTarget || !servidor.bots.includes(botTarget.id)) {
          return interaction.reply({ content: '❌ Ese bot **no está en la lista de vigilancia**.', ephemeral: true });
        }

        servidor.bots = servidor.bots.filter(id => id !== botTarget.id);
        await guardarConfig(config);

        const dmEnviado = await intentarEnviarDM(botTarget, `Hola! Has sido removido de la lista de bots vigilados en el servidor **${interaction.guild.name}**.`);

        return interaction.reply({
          content: `🗑️ El bot **${botTarget.tag}** ha sido **eliminado de la lista de vigilancia**.\n` +
                   (dmEnviado ? '✉️ Se pudo enviar un DM al bot.' : '⚠️ No se pudo enviar DM al bot.')
          ,
          ephemeral: true
        });
      }

      case 'ver': {
        if (servidor.bots.length === 0) {
          return interaction.reply({ content: '📭 No hay bots siendo vigilados actualmente.', ephemeral: true });
        }

        const lista = servidor.bots.map((id, i) => `${i + 1}. <@${id}> \`(${id})\``).join('\n');
        return interaction.reply({ content: `📋 **Bots vigilados actualmente:**\n${lista}`, ephemeral: true });
      }

      case 'desactivar': {
        config[guildId] = { activos: false, bots: [] };
        await guardarConfig(config);
        return interaction.reply({ content: '🚫 El sistema ha sido **desactivado y reiniciado**.', ephemeral: true });
      }

      case 'habilitar': {
        if (servidor.bots.length === 0) {
          return interaction.reply({ content: '⚠️ No hay bots configurados para vigilar. Usa la opción **"elegir"** primero.', ephemeral: true });
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
