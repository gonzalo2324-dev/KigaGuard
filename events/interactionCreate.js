const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { readConfig } = require('../utils/configHandler');

// Caché temporal para verificaciones activas
const verificacionActiva = new Map(); // userId => { code, guildId, messageId }

const alertConfigPath = path.join(__dirname, '..', 'data', 'alertConfig.json');
function readAlertConfig() {
  if (!fs.existsSync(alertConfigPath)) return {};
  return JSON.parse(fs.readFileSync(alertConfigPath, 'utf8'));
}

function generarCodigo(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generarOpcionesMenu(correctCode) {
  const opciones = [correctCode];
  while (opciones.length < 3) {
    const nueva = generarCodigo(5);
    if (!opciones.includes(nueva)) opciones.push(nueva);
  }
  return opciones
    .sort(() => Math.random() - 0.5)
    .map(code => new StringSelectMenuOptionBuilder().setLabel(code).setValue(code));
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Botón "Verificarme"
    if (interaction.isButton() && interaction.customId === 'verificarme') {
      const config = readConfig(interaction.guildId);
      if (!config || !config.rolNoVerificadoId || !config.rolVerificadoId) {
        return interaction.reply({ content: '❌ Configuración no encontrada para este servidor.', ephemeral: true });
      }

      await interaction.reply({ content: '✅ Revisa tus mensajes privados.', ephemeral: true });

      const code = generarCodigo(5);
      const opciones = generarOpcionesMenu(code);

      try {
        const dm = await interaction.member.send({
          content: `🔒 Selecciona el código correcto para confirmar tu acceso:\n\n**Tu código es:** \`${code}\``,
          components: [
            new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId(`codigo`)
                .setPlaceholder('Selecciona tu código')
                .addOptions(opciones)
            )
          ]
        });

        // Guardar verificación activa
        verificacionActiva.set(interaction.user.id, {
          code,
          guildId: interaction.guildId,
          messageId: dm.id
        });

      } catch (err) {
        console.error('❌ No pude enviar mensaje privado al usuario:', err.message);
        return interaction.followUp({
          content: '❌ No pude enviarte un mensaje privado. Revisa tu configuración.',
          ephemeral: true
        });
      }
    }

    // Menú de selección de código
    if (interaction.isStringSelectMenu() && interaction.customId === 'codigo') {
      const seleccion = interaction.values[0];
      const datosVerificacion = verificacionActiva.get(interaction.user.id);
      const alertConfig = readAlertConfig();

      if (!datosVerificacion) {
        return interaction.reply({
          content: '❌ Esta verificación ha expirado o no fue registrada.',
          ephemeral: true
        });
      }

      const { code: codigoCorrecto, guildId, messageId } = datosVerificacion;
      const config = readConfig(guildId);

      if (!config || !config.rolNoVerificadoId || !config.rolVerificadoId) {
        return interaction.reply({
          content: '❌ Configuración del servidor no encontrada. Contacta a un administrador.',
          ephemeral: true
        });
      }

      const guild = interaction.client.guilds.cache.get(guildId);
      if (!guild) {
        return interaction.reply({
          content: '❌ Ya no estoy en el servidor al que intentas verificarte.',
          ephemeral: true
        });
      }

      const alertChannelId = alertConfig[guildId];
      const alertChannel = alertChannelId ? guild.channels.cache.get(alertChannelId) : null;

      // Deshabilitar menú en el DM
      try {
        const dmChannel = await interaction.user.createDM();
        const mensajeOriginal = await dmChannel.messages.fetch(messageId);
        const menuOriginal = mensajeOriginal.components[0].components[0];
        const deshabilitado = StringSelectMenuBuilder.from(menuOriginal).setDisabled(true);
        const fila = new ActionRowBuilder().addComponents(deshabilitado);
        await mensajeOriginal.edit({ components: [fila] });
      } catch (e) {
        console.warn('⚠️ No se pudo editar el menú para deshabilitarlo:', e.message);
      }

      // Código incorrecto
      if (seleccion !== codigoCorrecto) {
        if (alertChannel) {
          try {
            await alertChannel.send(`❌ ${interaction.user.tag} falló la verificación. Código incorrecto.`);
          } catch (err) {
            console.error('❌ No pude enviar mensaje de fallo de verificación al canal de alertas:', err.message);
          }
        }
        return interaction.reply({
          content: '❌ Código incorrecto. Intenta de nuevo.',
          ephemeral: true
        });
      }

      // Código correcto → asignar roles
      try {
        const member = await guild.members.fetch(interaction.user.id);
        await member.roles.remove(config.rolNoVerificadoId).catch(() => {});
        await member.roles.add(config.rolVerificadoId).catch(() => {});

        if (alertChannel) {
          try {
            await alertChannel.send(`✅ ${member.user.tag} se ha verificado correctamente y ahora tiene acceso completo.`);
          } catch (err) {
            console.error('❌ No pude enviar el mensaje de verificación al canal de alertas:', err.message);
          }
        }

        await interaction.reply({
          content: '✅ ¡Código correcto! Estás verificado.',
          ephemeral: true
        });

        verificacionActiva.delete(interaction.user.id);

      } catch (error) {
        console.error('❌ Error asignando roles:', error);
        await interaction.reply({
          content: '❌ Error al asignar roles. Contacta con un administrador.',
          ephemeral: true
        });
      }
    }
  }
};
