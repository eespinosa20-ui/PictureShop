import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import conexion from "../baseDatos/conexion";
import type { RowDataPacket } from "mysql2/promise";

const RUTA_ALMACENAMIENTO = path.resolve(process.cwd(), "almacenamiento");
const RUTA_EVENTOS = path.join(RUTA_ALMACENAMIENTO, "eventos");
const RUTA_ELIMINANDO = path.join(RUTA_ALMACENAMIENTO, "eliminando");

export type ResultadoEliminarEvento =
  | { eliminado: true; advertencia?: string }
  | {
      eliminado: false;
      motivo: "no_existe" | "pedidos";
      cantidadPedidos?: number;
    };

interface FilaCantidad extends RowDataPacket {
  cantidad: number | string;
}

interface TrasladoCarpeta {
  rutaOriginal: string;
  rutaTemporal: string;
}

/**
 * Elimina un evento propiedad del fotografo junto con sus dependencias.
 * Bloquea la eliminacion si el evento tiene pedidos asociados.
 * El directorio de archivos se traslada temporalmente antes del borrado SQL
 * y se restaura si la transaccion falla.
 */
export async function eliminarEvento(
  idEvento: number,
  idFotografo: number
): Promise<ResultadoEliminarEvento> {
  const conexionTransaccion = await conexion.getConnection();
  let traslado: TrasladoCarpeta | null = null;
  let transaccionConfirmada = false;

  try {
    await conexionTransaccion.beginTransaction();

    const [eventos] = await conexionTransaccion.execute<RowDataPacket[]>(
      `SELECT idEvento
       FROM evento
       WHERE idEvento = ? AND idFotografo = ?
       FOR UPDATE`,
      [idEvento, idFotografo]
    );

    if (eventos.length === 0) {
      await conexionTransaccion.rollback();
      return { eliminado: false, motivo: "no_existe" };
    }

    const [pedidos] = await conexionTransaccion.execute<FilaCantidad[]>(
      "SELECT COUNT(*) AS cantidad FROM pedido WHERE idEvento = ?",
      [idEvento]
    );

    const cantidadPedidos = Number(pedidos[0]?.cantidad ?? 0);

    if (cantidadPedidos > 0) {
      await conexionTransaccion.rollback();
      return { eliminado: false, motivo: "pedidos", cantidadPedidos };
    }

    traslado = await trasladarCarpetaEvento(idEvento);

    await conexionTransaccion.execute(
      `DELETE dc FROM detallecarrito dc
       INNER JOIN carrito c ON dc.idCarrito = c.idCarrito
       WHERE c.idEvento = ?`,
      [idEvento]
    );

    await conexionTransaccion.execute(
      "DELETE FROM carrito WHERE idEvento = ?",
      [idEvento]
    );

    await conexionTransaccion.execute(
      "DELETE FROM accesoevento WHERE idEvento = ?",
      [idEvento]
    );

    await conexionTransaccion.execute(
      "DELETE FROM foto WHERE idEvento = ?",
      [idEvento]
    );

    await conexionTransaccion.execute(
      "DELETE FROM evento WHERE idEvento = ? AND idFotografo = ?",
      [idEvento, idFotografo]
    );

    await conexionTransaccion.commit();
    transaccionConfirmada = true;

    let advertencia: string | undefined;

    if (traslado) {
      try {
        await fs.rm(traslado.rutaTemporal, { recursive: true, force: true });
      } catch (error) {
        console.error(
          "No se pudo eliminar el directorio temporal del evento:",
          error
        );
        advertencia = `El evento se elimino de la base de datos, pero los archivos quedaron en ${traslado.rutaTemporal}`;
      }
    }

    traslado = null;

    return advertencia ? { eliminado: true, advertencia } : { eliminado: true };
  } catch (error) {
    if (!transaccionConfirmada) {
      try {
        await conexionTransaccion.rollback();
      } catch (errorRollback) {
        console.error(
          "Error al revertir la transaccion de eliminacion:",
          errorRollback
        );
      }

      if (traslado) {
        try {
          await fs.rename(traslado.rutaTemporal, traslado.rutaOriginal);
        } catch (errorRestauracion) {
          console.error(
            `CRITICO: no se pudo restaurar el directorio del evento. Origen: ${traslado.rutaTemporal}. Destino: ${traslado.rutaOriginal}`,
            errorRestauracion
          );
        }
      }
    }

    throw error;
  } finally {
    conexionTransaccion.release();
  }
}

/**
 * Traslada el directorio del evento a una carpeta temporal fuera de eventos/.
 * Devuelve null si el evento no tiene archivos almacenados.
 */
async function trasladarCarpetaEvento(
  idEvento: number
): Promise<TrasladoCarpeta | null> {
  const rutaOriginal = path.resolve(RUTA_EVENTOS, String(idEvento));

  if (path.dirname(rutaOriginal) !== RUTA_EVENTOS) {
    throw new Error("Ruta de evento no valida");
  }

  try {
    const informacion = await fs.stat(rutaOriginal);

    if (!informacion.isDirectory()) {
      throw new Error("La ruta del evento no es un directorio");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }

  await fs.mkdir(RUTA_ELIMINANDO, { recursive: true });

  const rutaTemporal = path.resolve(
    RUTA_ELIMINANDO,
    `${idEvento}-${randomUUID()}`
  );

  if (path.dirname(rutaTemporal) !== RUTA_ELIMINANDO) {
    throw new Error("Ruta temporal no valida");
  }

  await fs.rename(rutaOriginal, rutaTemporal);

  return { rutaOriginal, rutaTemporal };
}
