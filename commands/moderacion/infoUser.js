const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info-user')
    .setDescription('Muestra info de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a consultar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario');

    // Ruta del JSON con la blacklist en la carpeta raíz KigaBot2
    const blacklistPath = path.join(__dirname, '..', '..', 'data', 'blacklist.json');

    // Leer el JSON
    let blacklist = {};
    try {
      const rawData = fs.readFileSync(blacklistPath, 'utf-8');
      blacklist = JSON.parse(rawData);
    } catch (error) {
      console.error('Error leyendo blacklist.json', error);
    }

    // Checar si el usuario está en blacklist
    const blacklistedInfo = blacklist[user.id];
    const isBlacklisted = !!blacklistedInfo;

    // Crear embed
    const embed = new EmbedBuilder()
      .setTitle(`Información de ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Nombre', value: user.username, inline: true },
        { name: 'Perfil', value: user.bot ? 'Bot 📺' : 'Humano 🧑', inline: true },
        { name: 'Cuenta creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false },
        { name: 'Discriminador', value: `#${user.discriminator}`, inline: true },
        { name: 'En blacklist', value: isBlacklisted ? 'Sí 🔴' : 'No 🟢', inline: true }
      )
      .setColor(isBlacklisted ? 0xFF0000 : 0x00FF00)
      .setFooter({ text: `Pedido por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    if (isBlacklisted) {
      embed.addFields(
        { name: 'Razón', value: blacklistedInfo.reason || 'Sin razón especificada', inline: false },
        { name: 'Añadido el', value: `<t:${Math.floor(new Date(blacklistedInfo.addedAt).getTime() / 1000)}:F>`, inline: false },
        { name: 'Tag en blacklist', value: blacklistedInfo.tag || 'NA', inline: false }
      );
    }

    await interaction.reply({ embeds: [embed] });
  }
};

