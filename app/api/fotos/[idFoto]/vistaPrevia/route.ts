import path from "node:path";
import fs from "node:fs/promises";
import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import conexion from "@/servidor/baseDatos/conexion";
import type { RowDataPacket } from "mysql2/promise";

export async function GET(
  _request: Request,
  context: { params: Promise<{ idFoto: string }> }
) {
  try {
    const sesion = await obtenerSesion();

    if (!sesion) {
      return Response.json(
        { mensaje: "Debes iniciar sesion" },
        { status: 401 }
      );
    }

    const { idFoto: idFotoParam } = await context.params;
    const idFoto = Number(idFotoParam);

    if (!Number.isSafeInteger(idFoto) || idFoto <= 0) {
      return Response.json(
        { mensaje: "Identificador de foto invalido" },
        { status: 400 }
      );
    }

    let ubicacionVistaPrevia: string | null = null;
    let idEventoFoto: number | null = null;

    if (sesion.tipoUsuario === "cliente") {
      // Verificar que el cliente tenga acceso al evento de la foto
      const sqlCliente = `
        SELECT f.ubicacionVistaPrevia, f.idEvento
        FROM foto f
        INNER JOIN accesoevento a ON f.idEvento = a.idEvento AND a.idCliente = ?
        WHERE f.idFoto = ?
        LIMIT 1
      `;
      const [filas] = await conexion.execute<RowDataPacket[]>(sqlCliente, [
        sesion.idUsuario,
        idFoto,
      ]);

      if (filas.length === 0) {
        return Response.json(
          { mensaje: "No tienes autorizacion para ver esta fotografia" },
          { status: 403 }
        );
      }

      ubicacionVistaPrevia = filas[0].ubicacionVistaPrevia;
      idEventoFoto = filas[0].idEvento;
    } else if (sesion.tipoUsuario === "fotografo") {
      // Verificar que el fotógrafo sea el dueño del evento de la foto
      const sqlFotografo = `
        SELECT f.ubicacionVistaPrevia, f.idEvento
        FROM foto f
        INNER JOIN evento e ON f.idEvento = e.idEvento AND e.idFotografo = ?
        WHERE f.idFoto = ?
        LIMIT 1
      `;
      const [filas] = await conexion.execute<RowDataPacket[]>(sqlFotografo, [
        sesion.idUsuario,
        idFoto,
      ]);

      if (filas.length === 0) {
        return Response.json(
          { mensaje: "No tienes autorizacion para ver esta fotografia" },
          { status: 403 }
        );
      }

      ubicacionVistaPrevia = filas[0].ubicacionVistaPrevia;
      idEventoFoto = filas[0].idEvento;
    }

    if (!ubicacionVistaPrevia || !idEventoFoto) {
      return Response.json(
        { mensaje: "Fotografia no encontrada" },
        { status: 404 }
      );
    }

    // Resolver ruta absoluta delimitada de forma segura a la carpeta almacenamiento
    const nombreArchivo = path.basename(ubicacionVistaPrevia);
    const rutaAbsoluta = path.join(
      process.cwd(),
      "almacenamiento",
      "eventos",
      String(idEventoFoto),
      "vistasPrevias",
      nombreArchivo
    );

    try {
      const buffer = await fs.readFile(rutaAbsoluta);

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=86400",
        },
      });
    } catch {
      return Response.json(
        { mensaje: "El archivo de vista previa no se encuentra en el servidor" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error al servir vista previa:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
