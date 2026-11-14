import "server-only";
import conexion from "../baseDatos/conexion";
import type { RowDataPacket } from "mysql2/promise";

export interface FotoEvento extends RowDataPacket {
  idFoto: number;
  idEvento: number;
  nombreFoto: string;
  fechaPublicacion: string | Date;
}

export async function obtenerFotosEvento(
  idEvento: number
): Promise<FotoEvento[]> {
  try {
    const sql = `
      SELECT idFoto, idEvento, nombreFoto, fechaPublicacion
      FROM foto
      WHERE idEvento = ?
      ORDER BY fechaPublicacion DESC, idFoto ASC
    `;

    const [filas] = await conexion.execute<FotoEvento[]>(sql, [idEvento]);

    return filas;
  } catch (error) {
    console.error("Error al obtener fotos del evento:", error);
    throw error;
  }
}
