import "server-only";
import { crearTransportador, escaparHtml, leerConfiguracionCorreo } from "./smtp";

export async function enviarCorreoRecuperacion(correo: string, enlace: string) {
  const { configuracion } = leerConfiguracionCorreo();
  if (!configuracion) throw new Error("SMTP no configurado", { cause: "SMTP_NO_CONFIGURADO" });

  const introduccion = "Recibimos una solicitud para restablecer la contraseña de tu cuenta de PictureShop.";
  const instruccion = "Para establecer una nueva contraseña, utiliza el siguiente enlace:";
  const vigencia = "Este enlace expirará en 15 minutos y solo puede utilizarse una vez.";
  const aviso = "Si no solicitaste este cambio, puedes ignorar este mensaje.";
  const resultado = await crearTransportador(configuracion).sendMail({
    from: configuracion.from,
    to: { name: "", address: correo.trim() },
    subject: "Recuperación de contraseña - PictureShop",
    text: [introduccion, instruccion, enlace, vigencia, aviso].join("\n\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #181913; line-height: 1.5;">
        <h1 style="font-size: 20px;">PictureShop</h1>
        <p>${introduccion}</p>
        <p>${instruccion}</p>
        <p><a style="color: #365D3D; font-weight: bold;" href="${escaparHtml(enlace)}">Restablecer contraseña</a></p>
        <p>${vigencia}</p>
        <p>${aviso}</p>
      </div>
    `,
  });

  if (!resultado.accepted.length) {
    throw new Error("Correo de recuperación rechazado", { cause: "EENVELOPE" });
  }
}
