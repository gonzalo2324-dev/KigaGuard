const fs = require('fs');
const path = require('path');

const rutaLogs = path.join(__dirname, '..', 'logs', 'accesos.txt');

function logAcceso(userId, userTag) {
  return new Promise((resolve, reject) => {
    const fecha = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
    const linea = `[${fecha}] Acceso al comando /owner por ${userTag} (${userId})\n`;

    fs.mkdir(path.dirname(rutaLogs), { recursive: true }, err => {
      if (err) return reject(err);

      fs.appendFile(rutaLogs, linea, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

module.exports = {
  logAcceso
};
