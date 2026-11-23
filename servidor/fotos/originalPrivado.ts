import "server-only";
import { realpath } from "node:fs/promises";
import path from "node:path";

export const tiposImagen: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export async function resolverOriginalPrivado(foto: {
  idFoto: number;
  idEvento: number;
  nombreFoto: string | null;
  ubicacionArchivo: string | null;
}) {
  if (!foto.ubicacionArchivo) return null;

  const carpeta = `almacenamiento/eventos/${foto.idEvento}/originales/`;
  const ubicacion = foto.ubicacionArchivo.replaceAll("\\", "/");
  if (!ubicacion.startsWith(carpeta)) return null;
  const archivo = ubicacion.slice(carpeta.length);
  if (!/^[a-z0-9_-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(archivo)) return null;

  const raiz = await realpath(process.cwd());
  const ruta = path.join(raiz, carpeta, archivo);
  const rutaReal = await realpath(ruta).catch(() => null);
  if (!rutaReal || path.relative(ruta, rutaReal)) return null;

  const extension = path.extname(archivo).toLowerCase();
  const nombreBase = path.parse((foto.nombreFoto ?? "").replaceAll("\\", "/")).name
    .replace(/[\x00-\x1f\x7f]/g, "").trim() || `foto-${foto.idFoto}`;
  return { ruta: rutaReal, extension, nombreBase: nombreBase.toWellFormed() };
}
