module.exports = {
  async execute(interaction, client) {
    const member = interaction.member || await interaction.guild.members.fetch(interaction.user.id);
    const selected = interaction.values[0];

    client.verificationData = client.verificationData || new Map();

    const codigoCorrecto = client.verificationData.get(member.id);

    if (!codigoCorrecto) {
      return interaction.reply({ content: '❌ No tienes ninguna verificación pendiente.', ephemeral: true });
    }

    if (selected === codigoCorrecto) {
      // Lee config para este servidor
      const { readConfig } = require('../../utils/configHandler');
      const config = await readConfig(interaction.guild.id);

      if (!config) {
        return interaction.reply({ content: '❌ Configuración no encontrada. Contacta con un administrador.', ephemeral: true });
      }

      // Añadir y quitar roles
      await member.roles.add(config.rolVerificadoId).catch(console.error);
      await member.roles.remove(config.rolNoVerificadoId).catch(console.error);

      client.verificationData.delete(member.id);

      await interaction.reply({ content: '✅ Verificación completada correctamente. ¡Bienvenido!', ephemeral: true });

      // Opcional: enviar mensaje al canal de verificación que se completó
      const canal = interaction.guild.channels.cache.get(config.canalVerificacionId);
      if (canal) {
        canal.send(`✅ ${member} se ha verificado correctamente.`);
      }
    } else {
      await interaction.reply({ content: '❌ Código incorrecto, inténtalo de nuevo.', ephemeral: true });
    }
  }
};
    