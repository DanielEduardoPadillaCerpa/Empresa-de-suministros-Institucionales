const { enviarCorreoEnSegundoPlano } = require('./seguridad/correo');

// Aviso al buzón administrativo (ADMIN_NOTIFICATION_EMAIL) cuando llega un
// reporte de cliente o una solicitud de contacto. Solo lleva el tipo y el
// número: el contenido y los datos del remitente se leen en el panel, con
// sesión y permiso. Va por correo directo (nodemailer), no por n8n, para que
// ningún texto libre del cliente salga del backend.
function avisarAdministrador({ asunto, texto }) {
  const destino = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!destino) return;
  enviarCorreoEnSegundoPlano({ to: destino, subject: asunto, text: texto });
}

module.exports = { avisarAdministrador };
