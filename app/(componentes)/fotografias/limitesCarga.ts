export const extensionesFotografia = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
export const fotosPorLote = 8;
export const maximoBytesFoto = 25 * 1024 * 1024;

export function extensionPermitida(nombre: string) {
  const indice = nombre.lastIndexOf(".");
  return indice > 0 && extensionesFotografia.includes(nombre.slice(indice).toLowerCase());
}
