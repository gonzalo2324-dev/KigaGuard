// 📁 Archivo sugerido: events/interactionCreate/selectMenuHandler.js

const { Events } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { verificationCodes } = require('../../commands/moderacion/verificación');

const configPath = path.join(__dirname, '..', '..', 'data', 'verificacionConfig.json');
function readConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'verificar_codigo') return;

    const config = readConfig();
    const guildId = interaction.guild.id;
    const data = verificationCodes.get(interaction.user.id);

    if (!data) {
      return interaction.reply({ content: '❌ Este intento ha expirado. Usa `/verificación` nuevamente.', ephemeral: true });
    }

    const seleccion = interaction.values[0];
    if (seleccion === data.code) {
      verificationCodes.delete(interaction.user.id);

      const verificadoId = config[guildId]?.verificadoRol;
      const noVerificadoId = config[guildId]?.noVerificadoRol;
      if (!verificadoId || !noVerificadoId) {
        return interaction.reply({ content: '⚠️ Roles de verificación no configurados.', ephemeral: true });
      }

      await interaction.member.roles.remove(noVerificadoId).catch(() => {});
      await interaction.member.roles.add(verificadoId).catch(() => {});

      return interaction.update({ content: '✅ Verificación completada correctamente. ¡Bienvenido!', embeds: [], components: [] });
    }

    data.intentos++;

    if (data.intentos >= 2) {
      verificationCodes.delete(interaction.user.id);

      const canalAlertasId = config[guildId]?.canalVerificacion;
      if (canalAlertasId) {
        const canal = interaction.guild.channels.cache.get(canalAlertasId);
        if (canal) {
          canal.send(`⚠️ El usuario <@${interaction.user.id}> ha fallado dos intentos de verificación. Deberá esperar 5 minutos.`).catch(() => {});
        }
      }

      return interaction.update({
        content: '❌ Has fallado los 2 intentos. Intenta nuevamente en 5 minutos.',
        embeds: [],
        components: []
      });
    } else {
      const nuevoCodigo = generarCodigo();
      const nuevasOpciones = generarOpciones(nuevoCodigo);
      verificationCodes.set(interaction.user.id, { code: nuevoCodigo, intentos: 0 });

      const embed = {
        title: `🔒 Nuevo intento de Verificación - ${process.env.NOMBRE_BOT || 'Bot'}`,
        description: `Selecciona el código correcto.

Tu nuevo código es: \`${nuevoCodigo}\`

Tienes 1 intento restante.`,
        color: 0x007bff
      };

      const components = [
        {
          type: 1,
          components: [
            {
              type: 3,
              custom_id: 'verificar_codigo',
              placeholder: 'Selecciona el código correcto',
              options: nuevasOpciones.map(c => ({ label: c, value: c }))
            }
          ]
        }
      ];

      return interaction.update({ embeds: [embed], components });
    }
  }
};

function generarCodigo() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generarOpciones(correcto) {
  const opciones = new Set([correcto]);
  while (opciones.size < 5) {
    opciones.add(generarCodigo());
  }
  return Array.from(opciones).sort(() => Math.random() - 0.5);
}
