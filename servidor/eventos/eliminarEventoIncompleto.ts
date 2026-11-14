import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import conexion from "../baseDatos/conexion";

export async function eliminarEventoIncompleto(
  idEvento: number,
  idFotografo: number
): Promise<void> {
  try {
    // 1. Eliminar fotos asociadas al evento en MySQL
    await conexion.execute("DELETE FROM foto WHERE idEvento = ?", [idEvento]);

    // 2. Eliminar el evento solo si le pertenece al fotógrafo
    await conexion.execute(
      "DELETE FROM evento WHERE idEvento = ? AND idFotografo = ?",
      [idEvento, idFotografo]
    );

    // 3. Limpiar carpeta de almacenamiento si se había creado
    const rutaBaseEvento = path.join(
      process.cwd(),
      "almacenamiento",
      "eventos",
      String(idEvento)
    );

    try {
      await fs.rm(rutaBaseEvento, { recursive: true, force: true });
    } catch {
      // Ignorar si la carpeta no existía
    }
  } catch (error) {
    console.error("Error al eliminar evento incompleto:", error);
    throw error;
  }
}
