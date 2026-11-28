import { after } from "next/server";
import { esTipoUsuario, mensajeSolicitud } from "@/app/(autenticacion)/datosRecuperacion";
import { leerDatosRecuperacion, obtenerOrigen, responderRecuperacion } from "@/servidor/autenticacion/httpRecuperacion";
import { claveOrigen, enviarEnlaceRecuperacion, registrarErrorRecuperacion, reservarIntento } from "@/servidor/autenticacion/recuperacionContrasena";

export async function POST(solicitud: Request) {
  const { tipo, correo: entrada } = await leerDatosRecuperacion(solicitud);
  const correo = typeof entrada === "string" ? entrada.trim() : "";
  if (!esTipoUsuario(tipo) || correo.length > 80 ||
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(correo) ||
      correo.startsWith(".") || correo.includes("..") || correo.includes(".@") ||
      correo.split("@")[1].split(".").some((parte) => parte.startsWith("-") || parte.endsWith("-"))) {
    return responderRecuperacion("Ingresa un correo electrónico válido y selecciona el tipo de cuenta.", 400);
  }

  try {
    if (!await reservarIntento(claveOrigen("solicitud", obtenerOrigen(solicitud)), 20) ||
        !await reservarIntento(`cuenta:${tipo}:${correo.toLowerCase()}`, 3)) {
      return responderRecuperacion(mensajeSolicitud, 429);
    }

    after(() => enviarEnlaceRecuperacion(tipo, correo));
    return responderRecuperacion(mensajeSolicitud, 202);
  } catch (error) {
    registrarErrorRecuperacion("límites de solicitudes", error);
    return responderRecuperacion(mensajeSolicitud, 503);
  }
}
