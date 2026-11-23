import type { RowDataPacket } from "mysql2/promise";
import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import conexion from "@/servidor/baseDatos/conexion";
import VentanaUsuario from "./ventanaUsuario";

interface DatosUsuario extends RowDataPacket {
  nombre: string | null;
  correo: string | null;
}

export default async function PerfilEncabezado() {
  const sesion = await obtenerSesion();
  if (!sesion) return null;

  const consulta = sesion.tipoUsuario === "cliente"
    ? "SELECT nombre, correo FROM usuariocliente WHERE idCliente = ?"
    : "SELECT nombre, correo FROM usuariofotografo WHERE idFotografo = ?";
  const resultado = await conexion.execute<DatosUsuario[]>(consulta, [sesion.idUsuario]).catch(() => {
    console.error("No se pudo cargar el perfil del encabezado.");
    return null;
  });
  const usuario = resultado?.[0][0];
  return usuario ? (
    <VentanaUsuario
      key={`${sesion.tipoUsuario}-${sesion.idUsuario}`}
      nombre={usuario.nombre}
      correo={usuario.correo}
    />
  ) : null;
}
