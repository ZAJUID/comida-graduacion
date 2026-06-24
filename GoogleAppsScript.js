function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // --- NUEVO CÓDIGO DE NOTIFICACIONES POR CORREO E INSERCIÓN ---
    if (data.action === 'register') {
      // 1. Guardar en Google Sheets
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Invitados");
      if (sheet) {
        sheet.appendRow([
          data.timestamp, 
          data.nombre, 
          data.email, 
          data.telefono, 
          data.carrera, 
          data.acompanantes, 
          data.restricciones, 
          data.mensaje, 
          data.foto
        ]);
      }

      // 2. Enviar el correo a ti
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

      MailApp.sendEmail({
        to: emailAviso,
        subject: asunto,
        htmlBody: mensajeHtml
      });
      
    } else if (data.action === 'addPhoto') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Fotos");
      if (sheet) {
        sheet.appendRow([data.timestamp, data.url]);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getGuests') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Invitados");
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ guests: [] })).setMimeType(ContentService.MimeType.JSON);
      
      const data = sheet.getDataRange().getValues();
      const guests = [];
      
      // Asumimos que la fila 0 (o 1) tiene encabezados. Ignoramos la primera fila de encabezados.
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1]) { // Si hay nombre
          guests.push({
            timestamp: row[0],
            nombre: row[1],
            email: row[2],
            telefono: row[3],
            carrera: row[4],
            acompanantes: row[5],
            restricciones: row[6],
            mensaje: row[7],
            foto: row[8]
          });
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ guests: guests }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    else if (action === 'getPhotos') {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Fotos");
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ photos: [] })).setMimeType(ContentService.MimeType.JSON);
      
      const data = sheet.getDataRange().getValues();
      const photos = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][1]) {
          photos.push({
            timestamp: data[i][0],
            url: data[i][1]
          });
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ photos: photos }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Acción no válida" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
