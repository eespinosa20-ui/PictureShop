import "server-only";
import conexion from "../baseDatos/conexion";
import type { ResultSetHeader } from "mysql2/promise";

export async function renombrarEvento(
  idEvento: number,
  idFotografo: number,
  nombreEvento: string
): Promise<boolean> {
  try {
    const [resultado] = await conexion.execute<ResultSetHeader>(
      `UPDATE evento
       SET nombreEvento = ?
       WHERE idEvento = ? AND idFotografo = ?`,
      [nombreEvento, idEvento, idFotografo]
    );

    return resultado.affectedRows > 0;
  } catch (error) {
    console.error("Error al renombrar el evento:", error);
    throw error;
  }
}
