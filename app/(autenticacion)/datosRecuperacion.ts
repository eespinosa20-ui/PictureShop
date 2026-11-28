export function esTipoUsuario(tipo: unknown): tipo is "cliente" | "fotografo" {
  return tipo === "cliente" || tipo === "fotografo";
}

export type TipoUsuario = "cliente" | "fotografo";
export const mensajeSolicitud =
  "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.";
export const mensajeEnlaceInvalido =
  "El enlace es inválido, ha expirado o ya se utilizó. Solicita uno nuevo.";
export const maximoContrasena = 1024;

export function esTokenRecuperacion(token: unknown): token is string {
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
}
