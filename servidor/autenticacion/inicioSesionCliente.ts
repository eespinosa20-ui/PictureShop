
import conexion from "../baseDatos/conexion";
import type {  RowDataPacket } from "mysql2/promise";
import argon2 from "argon2";

interface ClienteEncontrado extends RowDataPacket {
  idCliente: number;
  contrasena: string;
}

export async function inicioSesionCliente(correo: string, contrasena: string): Promise<boolean>    {
    try {
        const sql = "SELECT idCliente, contrasena FROM usuarioCliente WHERE correo = ?";
        const [result] = await conexion.execute<ClienteEncontrado[]>(sql, [correo]);

        if (result.length === 0) {
            return false; 
        }

        const cliente = result[0];
        const esValida = await argon2.verify(cliente.contrasena, contrasena);

        return esValida;
    } catch (error) {
        console.error("Error al verificar credenciales:", error);
        throw error;
  }
}
