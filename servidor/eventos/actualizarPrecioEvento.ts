
import "server-only";
import conexion from "../baseDatos/conexion";
import type { ResultSetHeader } from "mysql2/promise";

export async function actualizarPrecioEvento(
  idEvento: number,
  idFotografo: number,
  costoFoto: number
): Promise<boolean> {
  try {
    const [resultado] = await conexion.execute<ResultSetHeader>(
      `UPDATE evento
       SET costoFoto = ?
       WHERE idEvento = ? AND idFotografo = ?`,
      [costoFoto, idEvento, idFotografo]
    );

    return resultado.affectedRows > 0;
  } catch (error) {
    console.error("Error al actualizar el precio del evento:", error);
    throw error;
  }
}
