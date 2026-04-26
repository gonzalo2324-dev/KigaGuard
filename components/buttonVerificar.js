const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

function generarCodigo() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 5; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

module.exports = {
  async execute(interaction, client) {
    const member = interaction.member;

    const codigo = generarCodigo();

    // Guardar el código y miembro para validar después
    client.verificationData = client.verificationData || new Map();
    client.verificationData.set(member.id, codigo);

    // Crear opciones, solo una es correcta
    const opciones = [
      { label: codigo, value: codigo },
      { label: generarCodigo(), value: generarCodigo() },
      { label: generarCodigo(), value: generarCodigo() }
    ];

    // Mezclar opciones para que la correcta no esté siempre primera
    opciones.sort(() => Math.random() - 0.5);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('select_verificar')
      .setPlaceholder('Selecciona el código correcto')
      .addOptions(opciones);

    const fila = new ActionRowBuilder().addComponents(menu);

    // Enviar mensaje privado al usuario con código y menú
    await interaction.user.send({
      content: `Aquí tienes tu código de verificación: \`${codigo}\`. Selecciona el código correcto en el menú desplegable para verificarte.`,
      components: [fila]
    });

    // Confirmar en el canal público que se envió el MD
    await interaction.reply({ content: '📬 Te he enviado un mensaje privado con la verificación.', ephemeral: true });
  }
};
