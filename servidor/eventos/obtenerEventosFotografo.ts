import "server-only";
import conexion from "../baseDatos/conexion";
import type { RowDataPacket } from "mysql2/promise";

export interface EventoFotografo extends RowDataPacket {
  idEvento: number;
  idFotografo: number;
  nombreEvento: string;
  costoFoto: number;
  claveEntrar: string;
  claveVerificacionPago: string;
  fechaCreacion: string | Date;
}

export async function obtenerEventosFotografo(
  idFotografo: number
): Promise<EventoFotografo[]> {
  try {
    const sql = `
      SELECT 
        idEvento,
        idFotografo,
        nombreEvento,
        costoFoto,
        claveEntrar,
        claveVerificacionPago,
        fechaCreacion
      FROM evento
      WHERE idFotografo = ?
      ORDER BY fechaCreacion DESC
    `;

    const [filas] = await conexion.execute<EventoFotografo[]>(sql, [idFotografo]);

    return filas;
  } catch (error) {
    console.error("Error al obtener eventos del fotografo:", error);
    throw error;
  }
}
