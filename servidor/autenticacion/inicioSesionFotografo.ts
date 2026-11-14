
import conexion from "../baseDatos/conexion";
import type {  RowDataPacket } from "mysql2/promise";
import argon2 from "argon2";

interface FotografoEncontrado extends RowDataPacket {
  idFotografo: number;
  contrasena: string;
}

export async function inicioSesionFotografo(correo: string, contrasena: string): Promise<number | null> {   {
    try {
        const sql = "SELECT idFotografo, contrasena FROM usuarioFotografo WHERE correo = ?";
        const [result] = await conexion.execute<FotografoEncontrado[]>(sql, [correo]);

        if (result.length === 0) {
            return null; 
        }

        const fotografo = result[0];
        const esValida = await argon2.verify(fotografo.contrasena, contrasena);

        return esValida ? fotografo.idFotografo : null;
    } catch (error) {
        console.error("Error al verificar credenciales:", error);
        throw error;
  }
}}
