const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const isOwner = require('../../utils/isOwner');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('owner')
    .setDescription('Muestra estadísticas privadas solo para owners'),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: '❌ No tienes permisos para usar este comando.', ephemeral: true });
    }

    // Evita el error de "Unknown interaction"
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('📊 Panel de Owner')
      .setDescription(
        `Bienvenido al **Panel de Control del Bot** 🛡️  
        
Como owner, tienes acceso **completo** a todas las funciones internas y herramientas administrativas del bot.  
Esto incluye:
- 🛠 Modificar y reiniciar módulos en tiempo real.
- 🔒 Gestionar la seguridad y configuraciones críticas.
- 📡 Supervisar el estado de todos los servidores donde está el bot.
- ⚙️ Ejecutar comandos restringidos y cambiar parámetros internos.

⚠️ **Advertencia:** Todo lo que hagas aquí se registra en los logs internos.  
Usa este poder con responsabilidad: cualquier cambio puede afectar a todos los servidores en los que el bot está activo.`
      )
      .addFields(
        { name: '🧠 RAM usada', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
        { name: '📶 Ping', value: `${interaction.client.ws.ping} ms`, inline: true },
        { name: '🧩 Servidores', value: `${interaction.client.guilds.cache.size}`, inline: true },
        { name: '🧑‍💻 Plataforma', value: `${os.platform()} (${os.arch()})`, inline: true },
        { name: '🧮 CPUs', value: `${os.cpus().length}`, inline: true }
      )
      .setFooter({ text: '⚠️ Acceso restringido: solo owners autorizados pueden ver esta información.' })
      .setColor('DarkRed')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
