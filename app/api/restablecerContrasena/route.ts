import { esTipoUsuario, esTokenRecuperacion, maximoContrasena, mensajeEnlaceInvalido } from "@/app/(autenticacion)/datosRecuperacion";
import { evaluarContrasena } from "@/app/(autenticacion)/requisitosContrasena";
import { leerDatosRecuperacion, obtenerOrigen, responderRecuperacion } from "@/servidor/autenticacion/httpRecuperacion";
import { claveOrigen, reservarIntento, restablecerContrasena } from "@/servidor/autenticacion/recuperacionContrasena";

export async function POST(solicitud: Request) {
  const { tipo, token, contrasena, confirmarContrasena } = await leerDatosRecuperacion(solicitud);
  if (!esTipoUsuario(tipo) || !esTokenRecuperacion(token)) {
    return responderRecuperacion(mensajeEnlaceInvalido, 400);
  }
  if (typeof contrasena !== "string" || contrasena.length > maximoContrasena ||
      !contrasena.trim() || !evaluarContrasena(contrasena).every(({ valido }) => valido)) {
    return responderRecuperacion("Usa entre 8 y 1024 caracteres, incluido un carácter especial.", 400);
  }
  if (contrasena !== confirmarContrasena) {
    return responderRecuperacion("Las contraseñas no coinciden.", 400);
  }

  try {
    if (!await reservarIntento(claveOrigen("cambio", obtenerOrigen(solicitud)), 30)) {
      return responderRecuperacion("Demasiados intentos. Inténtalo más tarde.", 429);
    }
    if (!await restablecerContrasena(tipo, token, contrasena)) {
      return responderRecuperacion(mensajeEnlaceInvalido, 400);
    }
    return responderRecuperacion("Tu contraseña se actualizó. Ya puedes iniciar sesión.");
  } catch {
    console.error("No se pudo completar el restablecimiento de contraseña.");
    return responderRecuperacion("No se pudo guardar la contraseña. Inténtalo de nuevo.", 500);
  }
}
