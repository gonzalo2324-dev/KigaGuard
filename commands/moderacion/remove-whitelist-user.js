const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'data', 'whitelistData.json');

function readWhitelist() {
  if (!fs.existsSync(filePath)) return {};
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function saveWhitelist(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-whitelist-user')
    .setDescription('Elimina un usuario de la whitelist de este servidor (solo dueño)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a eliminar de whitelist')
        .setRequired(true)),

  async execute(interaction) {
    // Verificación de propietario
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        content: '❌ Solo el dueño del servidor puede usar este comando.',
        ephemeral: true
      });
    }

    const user = interaction.options.getUser('usuario');
    const whitelistData = readWhitelist();

    // Comprobar si existe el servidor y si el usuario está en whitelist
    if (!whitelistData[interaction.guild.id] || !whitelistData[interaction.guild.id].whitelistUsers.includes(user.id)) {
      return interaction.reply({
        content: `❌ El usuario ${user.tag} no está en whitelist.`,
        ephemeral: true
      });
    }

    // Remover usuario y guardar
    whitelistData[interaction.guild.id].whitelistUsers = whitelistData[interaction.guild.id].whitelistUsers.filter(id => id !== user.id);
    saveWhitelist(whitelistData);

    await interaction.reply(`✅ Usuario ${user.tag} eliminado de la whitelist de este servidor.`);
  },
};
