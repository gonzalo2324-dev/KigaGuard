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
    .setName('add-whitelist-role')
    .setDescription('Agrega un rol a la whitelist de este servidor (solo dueño)')
    .addRoleOption(option =>
      option.setName('rol')
        .setDescription('Rol a agregar a whitelist')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: '❌ Solo el dueño del servidor puede usar este comando.', ephemeral: true });
    }

    const role = interaction.options.getRole('rol');
    const whitelistData = readWhitelist();

    if (!whitelistData[interaction.guild.id]) {
      whitelistData[interaction.guild.id] = { whitelistRoles: [], whitelistUsers: [] };
    }

    if (whitelistData[interaction.guild.id].whitelistRoles.includes(role.id)) {
      return interaction.reply({ content: `❌ El rol ${role.name} ya está en whitelist.`, ephemeral: true });
    }

    whitelistData[interaction.guild.id].whitelistRoles.push(role.id);
    saveWhitelist(whitelistData);

    await interaction.reply(`✅ Rol ${role.name} agregado a la whitelist de este servidor.`);
  },
};
