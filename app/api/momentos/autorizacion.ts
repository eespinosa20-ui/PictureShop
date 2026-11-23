import { obtenerSesion } from "@/servidor/autenticacion/sesion";

export function responderMomentos(mensaje: string, status: number) {
  return Response.json({ mensaje }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function autorizarClienteMomentos() {
  const sesion = await obtenerSesion();
  if (!sesion) return responderMomentos("Debes iniciar sesión.", 401);
  if (sesion.tipoUsuario !== "cliente") return responderMomentos("Acceso no autorizado.", 403);
  return sesion;
}

export function leerIdentificador(valor: string) {
  const numero = Number(valor);
  return /^\d+$/.test(valor) && Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}
