const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const ownerIDs = process.env.OWNERS?.split(',') || [];
const botName = process.env.NOMBRE_BOT || 'Bot';

const readJson = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data || '{}');
  } catch {
    return {};
  }
};

const writeJson = async (filePath, data) => {
  return fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklistremove')
    .setDescription('Quita a un usuario de la blacklist y lo desbanea globalmente.')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Usuario a remover de la blacklist')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!ownerIDs.includes(interaction.user.id)) {
      return interaction.editReply({
        content: '❌ Este comando es solo para los dueños del bot.'
      });
    }

    const user = interaction.options.getUser('usuario');
    const blacklistPath = path.join(__dirname, '../../data/blacklist.json');
    const pendingBansPath = path.join(__dirname, '../../data/pendingBans.json');

    const blacklist = await readJson(blacklistPath);
    const pendingBans = await readJson(pendingBansPath);

    if (!blacklist[user.id]) {
      return interaction.editReply({
        content: `❌ El usuario ${user.tag} no está en la blacklist.`
      });
    }

    // 1. Eliminar de blacklist.json
    delete blacklist[user.id];
    await writeJson(blacklistPath, blacklist);

    // 2. Eliminar de pendingBans.json
    let pendingRemovals = 0;
    for (const guildId of Object.keys(pendingBans)) {
      if (pendingBans[guildId][user.id]) {
        delete pendingBans[guildId][user.id];
        pendingRemovals++;
        if (Object.keys(pendingBans[guildId]).length === 0) {
          delete pendingBans[guildId]; // limpiar si queda vacío
        }
      }
    }
    await writeJson(pendingBansPath, pendingBans);

    const client = interaction.client;
    let desbaneosExitosos = 0;
    let desbaneosFallidos = 0;

    // 3. Revisar bans y desbanear solo si es por blacklist
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const bans = await guild.bans.fetch();
        const bannedUser = bans.get(user.id);

        if (bannedUser && bannedUser.reason && bannedUser.reason.includes('Agregado a blacklist')) {
          await guild.members.unban(user.id, 'Removido de la blacklist global');
          desbaneosExitosos++;
          console.log(`✅ Desbaneado ${user.tag} en ${guild.name}`);
        }
      } catch (error) {
        console.error(`❌ Error desbaneando a ${user.tag} en ${guild.name}:`, error);
        desbaneosFallidos++;
      }
    }

    // 4. Solo MD al usuario
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('✅ Has sido removido de la Blacklist Global')
        .setColor('#43b581') // verde bonito
        .setDescription(
          'Buenas noticias 🎉\n\n' +
          'Has sido removido de la **blacklist global** de ' + botName + '. ' +
          'Esto significa que ya no estarás baneado automáticamente de nuestros servidores.\n\n' +
          '¡Bienvenido de vuelta! 🚀'
        )
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .addFields(
          { name: '👤 Usuario', value: `${user.tag} (\`${user.id}\`)`, inline: false },
          { name: '🧑 Moderador', value: interaction.user.tag, inline: false },
          { name: '🔓 Desbaneos realizados', value: `${desbaneosExitosos}`, inline: true },
          { name: '🗑️ Pendings eliminados', value: `${pendingRemovals}`, inline: true },
          { name: '🕒 Tiempo', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        )
        .setFooter({ text: `${botName} - Sistema de Blacklist`, iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

      await user.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`⚠️ No se pudo enviar DM a ${user.tag}.`, err.message);
      await interaction.followUp({
        content: `⚠️ No se pudo enviar un mensaje directo a ${user.tag}.`,
        ephemeral: true,
      });
    }

    // 5. Respuesta al moderador (ephemeral)
    return interaction.editReply({
      content: `✅ Usuario **${user.tag}** removido de la blacklist.\n🔓 Desbaneado de **${desbaneosExitosos}** servidor(es).\n🗑️ Eliminado de **${pendingRemovals}** pendings.\n⚠️ Fallos en **${desbaneosFallidos}** servidor(es).`
    });
  },
};
