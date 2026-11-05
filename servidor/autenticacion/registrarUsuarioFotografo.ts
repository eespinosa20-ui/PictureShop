
import conexion from "../baseDatos/conexion";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import argon2 from "argon2";

interface FotografoEncontrado extends RowDataPacket {
  idFotografo: number;
}

export async function existeCorreoFotografo(correo: string):
 Promise<boolean> {
  try {
    const sql = "SELECT idFotografo FROM usuarioFotografo WHERE correo = ?";


    const [resultado] = await conexion.execute<FotografoEncontrado[]>(
      sql,
      [correo]
    );

    return resultado.length > 0;

  } catch (error) {
    console.error("Error al consultar usuario:", error);
    throw error;
  }
}

export async function registrarUsuarioFotografo(nombre: string, telefono: string, correo: string, contrasena: string) {

    const contrasenaHash = await argon2.hash(contrasena);
    const sql = "INSERT INTO usuarioFotografo (nombre, telefono, correo, contrasena, fechaRegistro) VALUES (?, ?, ?, ?, NOW())";
    const valores = [nombre, telefono, correo, contrasenaHash];

    try {
        const [resultado] = await conexion.execute<ResultSetHeader>(sql, valores);
        return resultado.insertId; 
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        throw error;
    }
}
