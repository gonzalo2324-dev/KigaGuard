const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'data', 'verificacionConfig.json');

function readConfig(guildId) {
    // Si el archivo no existe, lo crea vacío
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({}, null, 2), 'utf8');
    }

    let data = {};
    try {
        data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
        console.error('❌ Error leyendo verificacionConfig.json:', err);
        data = {};
    }

    // Si se pasa guildId, devuelve solo esa config, si no, devuelve todo
    if (guildId) {
        return data[guildId] || {};
    }
    return data;
}

function saveConfig(guildId, config) {
    let allConfig = readConfig(); // Ahora siempre devuelve un objeto
    allConfig[guildId] = config;

    try {
        fs.writeFileSync(configPath, JSON.stringify(allConfig, null, 2), 'utf8');
    } catch (err) {
        console.error('❌ Error guardando verificacionConfig.json:', err);
    }
}

module.exports = { readConfig, saveConfig };
