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
    .setName('add-whitelist-user')
    .setDescription('Agrega un usuario a la whitelist de este servidor (solo dueño)')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a agregar a whitelist')
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

    // Inicializar estructura si no existe
    if (!whitelistData[interaction.guild.id]) {
      whitelistData[interaction.guild.id] = { whitelistRoles: [], whitelistUsers: [] };
    }

    // Comprobar si ya está en whitelist
    if (whitelistData[interaction.guild.id].whitelistUsers.includes(user.id)) {
      return interaction.reply({
        content: `❌ El usuario ${user.tag} ya está en whitelist.`,
        ephemeral: true
      });
    }

    // Agregar usuario y guardar
    whitelistData[interaction.guild.id].whitelistUsers.push(user.id);
    saveWhitelist(whitelistData);

    await interaction.reply(`✅ Usuario ${user.tag} agregado a la whitelist de este servidor.`);
  },
};
