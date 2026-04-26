require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands/moderacion').filter(file => file.endsWith('.js'));

const commandNames = new Set();

for (const file of commandFiles) {
  const command = require(`./commands/moderacion/${file}`);

  if (!command.data || !(command.data instanceof SlashCommandBuilder)) {
    console.warn(`⚠️ El archivo ${file} no tiene 'data' o no es un SlashCommandBuilder válido.`);
    continue;
  }

  const name = command.data.name;
  if (commandNames.has(name)) {
    console.warn(`⚠️ Nombre duplicado detectado: '${name}' en el archivo '${file}'. Este comando no será registrado.`);
    continue;
  }
  commandNames.add(name);

  commands.push(command.data.toJSON());
}

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token) {
  console.error('❌ Token NO cargado en .env');
  process.exit(1);
}
if (!clientId) {
  console.error('❌ CLIENT_ID NO cargado en .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`🚀 Registrando ${commands.length} comandos globales...`);

    await rest.put(
      Routes.applicationCommands(clientId), // global commands
      { body: commands }
    );

    console.log('✅ Comandos globales registrados con éxito.');
  } catch (error) {
    console.error(error);
  }
})();
