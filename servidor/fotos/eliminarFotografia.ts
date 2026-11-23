import "server-only";
import { randomUUID } from "node:crypto";
import { lstat, realpath, rename, unlink } from "node:fs/promises";
import path from "node:path";
import type { RowDataPacket } from "mysql2/promise";
import conexion from "../baseDatos/conexion";

interface FotoEnDisco extends RowDataPacket {
  ubicacionArchivo: string | null;
  ubicacionVistaPrevia: string | null;
}

interface ArchivoApartado {
  ruta: string;
  temporal: string;
}

async function apartarArchivo(idEvento: number, tipo: "originales" | "vistasPrevias", ubicacion: string | null) {
  if (!ubicacion) return null;
  const prefijo = `almacenamiento/eventos/${idEvento}/${tipo}/`;
  const normalizada = ubicacion.replaceAll("\\", "/");
  const nombre = normalizada.slice(prefijo.length);
  const patron = tipo === "originales"
    ? /^[a-z0-9_-]+\.(jpg|jpeg|png|webp|avif)$/i
    : /^[a-z0-9_-]+\.webp$/i;
  if (!normalizada.startsWith(prefijo) || !patron.test(nombre)) {
    throw new Error("Ubicación de fotografía inválida.");
  }

  const raiz = await realpath(process.cwd());
  const ruta = path.join(raiz, prefijo, nombre);
  try {
    const datos = await lstat(ruta);
    if (!datos.isFile() || path.relative(ruta, await realpath(ruta))) {
      throw new Error("El archivo de fotografía no es válido.");
    }
    const temporal = path.join(path.dirname(ruta), `.eliminar-${randomUUID()}-${nombre}`);
    await rename(ruta, temporal);
    return { ruta, temporal };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function eliminarFotografia(idFotografo: number, idEvento: number, idFoto: number) {
  const transaccion = await conexion.getConnection();
  const apartados: ArchivoApartado[] = [];
  let confirmada = false;
  try {
    await transaccion.beginTransaction();
    const [eventos] = await transaccion.execute<RowDataPacket[]>(
      "SELECT idEvento FROM evento WHERE idEvento = ? AND idFotografo = ? FOR UPDATE",
      [idEvento, idFotografo]
    );
    if (!eventos.length) return "no_encontrada";

    const [[foto]] = await transaccion.execute<FotoEnDisco[]>(
      "SELECT ubicacionArchivo, ubicacionVistaPrevia FROM foto WHERE idEvento = ? AND idFoto = ? FOR UPDATE",
      [idEvento, idFoto]
    );
    if (!foto) return "no_encontrada";

    const [compras] = await transaccion.execute<RowDataPacket[]>(
      "SELECT idDetallePedido FROM detallepedido WHERE idFoto = ? LIMIT 1 FOR UPDATE",
      [idFoto]
    );
    if (compras.length) return "comprada";

    await transaccion.execute("DELETE FROM detallecarrito WHERE idFoto = ?", [idFoto]);
    await transaccion.execute("DELETE FROM foto WHERE idEvento = ? AND idFoto = ?", [idEvento, idFoto]);

    const original = await apartarArchivo(idEvento, "originales", foto.ubicacionArchivo);
    if (original) apartados.push(original);
    const vista = await apartarArchivo(idEvento, "vistasPrevias", foto.ubicacionVistaPrevia);
    if (vista) apartados.push(vista);

    await transaccion.commit();
    confirmada = true;
    return "eliminada";
  } finally {
    try {
      const resultados = await Promise.allSettled(apartados.map(({ ruta, temporal }) =>
        confirmada ? unlink(temporal) : rename(temporal, ruta)
      ));
      if (resultados.some((resultado) => resultado.status === "rejected")) {
        console.error("No se pudo finalizar la limpieza de archivos de una fotografía.", { idEvento, idFoto, confirmada });
      }
    } finally {
      try {
        if (!confirmada) await transaccion.rollback();
      } finally {
        transaccion.release();
      }
    }
  }
}
