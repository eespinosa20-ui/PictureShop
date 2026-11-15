
import { randomBytes } from "node:crypto";
import conexion from "../baseDatos/conexion";
import type { ResultSetHeader } from "mysql2/promise";

export async function crearEvento(
  idFotografo: number,
  nombreEvento: string,
  costoFoto: string
) {
  const claveEntrar = randomBytes(8)
    .toString("hex")
    .toUpperCase();

  const claveVerificacionPago = randomBytes(12)
    .toString("hex")
    .toUpperCase();

  const sql = `
    INSERT INTO evento (
      idFotografo,
      nombreEvento,
      costoFoto,
      claveEntrar,
      claveVerificacionPago,
      fechaCreacion
    )
    VALUES (?, ?, ?, ?, ?, NOW())
  `;

  const [resultado] = await conexion.execute<ResultSetHeader>(
    sql,
    [
      idFotografo,
      nombreEvento,
      costoFoto,
      claveEntrar,
      claveVerificacionPago
    ]
  );

  return {
    idEvento: resultado.insertId,
    claveEntrar,
    claveVerificacionPago
  };
}
