function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // --- NUEVO CÓDIGO DE NOTIFICACIONES POR CORREO ---
    if (data.action === 'register') {
      const emailAviso = 'zajuidcabreraduran@gmail.com';
      const asunto = '🎉 Nuevo Invitado: ' + data.nombre;
      let mensajeHtml = `<h2>¡Alguien confirmó asistencia a tu comida de graduación!</h2>
        <p><b>Nombre:</b> ${data.nombre}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Teléfono:</b> ${data.telefono || 'No especificado'}</p>
        <p><b>Carrera:</b> ${data.carrera}</p>
        <p><b>Acompañantes:</b> ${data.acompanantes}</p>
        <p><b>Restricciones alimentarias:</b> ${data.restricciones || 'Ninguna'}</p>
        <p><b>Mensaje:</b> ${data.mensaje || 'Ninguno'}</p>`;
      
      if (data.foto) {
        mensajeHtml += `<p><b>Foto subida:</b> <a href="${data.foto}">Ver foto de perfil</a></p>`;
      }

      // Enviar el correo a ti
      MailApp.sendEmail({
        to: emailAviso,
        subject: asunto,
        htmlBody: mensajeHtml
      });
      // ------------------------------------------------
      
      // Aquí va tu código original de guardar en la hoja de cálculo de Google.
      // Ejem:
      // const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Invitados");
      // sheet.appendRow([data.timestamp, data.nombre, data.email, data.telefono, data.carrera, data.acompanantes, data.restricciones, data.mensaje, data.foto]);
      
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
