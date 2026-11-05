
import conexion from "../baseDatos/conexion";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import argon2 from "argon2";

interface ClienteEncontrado extends RowDataPacket {
  idCliente: number;
}

export async function existeCorreoCliente(correo: string):
 Promise<boolean> {
  try {
    const sql = "SELECT idCliente FROM usuarioCliente WHERE correo = ?";


    const [resultado] = await conexion.execute<ClienteEncontrado[]>(
      sql,
      [correo]
    );

    return resultado.length > 0;

  } catch (error) {
    console.error("Error al consultar usuario:", error);
    throw error;
  }
}

export async function registrarUsuarioCliente(nombre: string, telefono: string, correo: string, contrasena: string) {

    const contrasenaHash = await argon2.hash(contrasena);
    const sql = "INSERT INTO usuarioCliente (nombre, telefono, correo, contrasena, fechaRegistro) VALUES (?, ?, ?, ?, NOW())";
    const valores = [nombre, telefono, correo, contrasenaHash];

    try {
        const [resultado] = await conexion.execute<ResultSetHeader>(sql, valores);
        return resultado.insertId; 
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        throw error;
    }
}
