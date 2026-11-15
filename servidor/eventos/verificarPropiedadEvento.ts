import "server-only";
import conexion from "../baseDatos/conexion";
import type { RowDataPacket } from "mysql2/promise";

export interface InfoEvento extends RowDataPacket {
  idEvento: number;
  idFotografo: number;
  nombreEvento: string;
  costoFoto: string;
  fechaCreacion: string | Date;
}

export interface ResultadoVerificacion {
  existe: boolean;
  autorizado: boolean;
  evento: InfoEvento | null;
}

export async function verificarPropiedadEvento(
  idEvento: number,
  idFotografo: number
): Promise<ResultadoVerificacion> {
  try {
    const sql = `
      SELECT idEvento, idFotografo, nombreEvento, costoFoto, fechaCreacion
      FROM evento
      WHERE idEvento = ?
      LIMIT 1
    `;

    const [filas] = await conexion.execute<InfoEvento[]>(sql, [idEvento]);

    if (filas.length === 0) {
      return { existe: false, autorizado: false, evento: null };
    }

    const evento = filas[0];

    if (evento.idFotografo !== idFotografo) {
      return { existe: true, autorizado: false, evento: null };
    }

    return { existe: true, autorizado: true, evento };
  } catch (error) {
    console.error("Error al verificar propiedad del evento:", error);
    throw error;
  }
}
