const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const ownerIDs = process.env.OWNERS?.split(',') || [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('salirservidor')
    .setDescription(`Hace que ${process.env.NOMBRE_BOT || 'Bot'} salga de un servidor usando su ID (solo owners).`),

  async execute(interaction) {
    const userId = interaction.user.id;

    if (!ownerIDs.includes(userId)) {
      return interaction.reply({
        content: '🚫 Solo los owners pueden usar este comando.',
        flags: 64
      });
    }

    const guilds = interaction.client.guilds.cache
      .map(guild => ({
        label: guild.name.length > 100 ? guild.name.slice(0, 97) + '...' : guild.name,
        value: guild.id
      }))
      .slice(0, 25);

    if (guilds.length === 0) {
      return interaction.reply({
        content: `${process.env.NOMBRE_BOT || 'Bot'} no está en ningún servidor.`,
        flags: 64
      });
    }

    const firstSelectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('seleccionar_servidor')
        .setPlaceholder('Selecciona un servidor')
        .addOptions(guilds)
    );

    await interaction.reply({
      content: 'Por favor, selecciona un servidor:',
      components: [firstSelectMenu],
      flags: 64
    });

    const filter = i => i.user.id === interaction.user.id;

    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000
    });

    collector.on('collect', async i => {
      if (i.customId === 'seleccionar_servidor') {
        const selectedGuildId = i.values[0];
        const selectedGuild = interaction.client.guilds.cache.get(selectedGuildId);

        if (!selectedGuild) {
          return i.reply({
            content: '❌ No se pudo encontrar el servidor seleccionado.',
            flags: 64
          });
        }

        let owner;
        try {
          owner = await selectedGuild.fetchOwner();
        } catch {
          owner = null;
        }
        const ownerTag = owner ? `${owner.user.tag} (${owner.id})` : 'No disponible';

        const secondSelectMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('confirmar_o_inicio')
            .setPlaceholder('¿Qué deseas hacer?')
            .addOptions([
              {
                label: 'Confirmar',
                value: 'confirmar',
                description: 'Confirmar salida del servidor'
              },
              {
                label: 'Inicio',
                value: 'inicio',
                description: 'Volver al listado de servidores'
              }
            ])
        );

        await i.update({
          content: `Has seleccionado el servidor: **${selectedGuild.name}**\n` +
                   `Owner del servidor: **${ownerTag}**\n\n` +
                   `¿Deseas confirmar la salida del servidor o volver al inicio?`,
          components: [secondSelectMenu],
          flags: 64
        });

        const secondCollector = i.channel.createMessageComponentCollector({
          filter,
          time: 15000
        });

        secondCollector.on('collect', async secondInteraction => {
          if (secondInteraction.customId === 'confirmar_o_inicio') {
            if (secondInteraction.values[0] === 'confirmar') {
              try {
                await selectedGuild.leave();
                return secondInteraction.update({
                  content: `${process.env.NOMBRE_BOT || 'Bot'} ha salido del servidor **${selectedGuild.name}** (\`${selectedGuild.id}\`).`,
                  components: [],
                  flags: 64
                });
              } catch (error) {
                console.error('❌ Error al salir del servidor:', error);
                return secondInteraction.update({
                  content: '❌ No se pudo salir del servidor. ¿El ID es correcto? ¿Está el bot en ese servidor?',
                  components: [],
                  flags: 64
                });
              }
            } else if (secondInteraction.values[0] === 'inicio') {
              return secondInteraction.update({
                content: 'Por favor, selecciona un servidor:',
                components: [firstSelectMenu],
                flags: 64
              });
            }
          }
        });
      }
    });
  }
};
