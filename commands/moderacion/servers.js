const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servers')
    .setDescription('📊 Muestra todos los servidores donde está el bot y sus estadísticas.'),

  ownerOnly: true,

  async execute(interaction) {
    const client = interaction.client;
    const user = interaction.user;

    // Responder rápido para evitar timeout
    await interaction.reply({ content: '⏳ Obteniendo información de servidores, revisa tus mensajes directos...', ephemeral: true });

    // Recopilar info de los servidores
    const servers = await Promise.all(client.guilds.cache.map(async guild => {
      let ownerTag = 'Desconocido';
      try {
        const owner = await guild.fetchOwner();
        ownerTag = owner.user.tag;  // username#discriminator
      } catch (err) {
        console.warn(`No se pudo obtener el dueño de ${guild.name}:`, err.message);
      }

      return {
        name: guild.name,
        id: guild.id,
        memberCount: guild.memberCount,
        owner: ownerTag,
        joinedAt: guild.joinedAt,
        channels: guild.channels.cache.size,
        roles: guild.roles.cache.size,
      };
    }));

    if (servers.length === 0) {
      return interaction.followUp({
        content: '❌ El bot no está en ningún servidor.',
        ephemeral: true
      });
    }

    // Ordenar alfabéticamente por nombre
    servers.sort((a, b) => a.name.localeCompare(b.name));

    const chunkSize = 5;
    const totalMembers = servers.reduce((acc, s) => acc + s.memberCount, 0);
    const embeds = [];

    // Crear embeds paginados de 5 servidores cada uno
    for (let i = 0; i < servers.length; i += chunkSize) {
      const chunk = servers.slice(i, i + chunkSize);

      const embed = new EmbedBuilder()
        .setTitle(`🌐 Lista de Servidores (Página ${Math.floor(i / chunkSize) + 1})`)
        .setColor('Blurple')
        .setDescription(
          chunk.map(s =>
            `🔹 **${s.name}**\n` +
            `🆔 ID: \`${s.id}\`\n` +
            `👑 Dueño: \`${s.owner}\`\n` +
            `📆 Unión: ${time(s.joinedAt, 'D')}\n` +
            `💬 Canales: **${s.channels}** | Roles: **${s.roles}**\n` +
            `👥 Miembros: **${s.memberCount.toLocaleString()}**`
          ).join('\n\n')
        )
        .setFooter({ text: `Total: ${servers.length} servidores | 👥 ${totalMembers.toLocaleString()} miembros en total` })
        .setTimestamp();

      embeds.push(embed);
    }

    // Enviar embeds por DM al usuario
    try {
      for (const embed of embeds) {
        await user.send({ embeds: [embed] });
      }

      // Confirmación pública efímera
      await interaction.followUp({
        content: `✅ Estoy en **${servers.length}** servidores. Te he enviado la lista completa por mensaje directo.`,
        ephemeral: true
      });
    } catch (err) {
      console.error('❌ Error enviando mensaje directo:', err);
      return interaction.followUp({
        content: '❌ No pude enviarte un mensaje directo. Asegúrate de tenerlos activados.',
        ephemeral: true
      });
    }
  },
};
