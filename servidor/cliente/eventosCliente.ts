import "server-only";
import conexion from "../baseDatos/conexion";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export interface EventoCliente extends RowDataPacket {
  idEvento: number;
  idFotografo: number;
  nombreEvento: string;
  costoFoto: number | string;
  fechaCreacion: string | Date;
  nombreFotografo: string | null;
  fechaAcceso: string | Date;
}

export interface FotoCliente extends RowDataPacket {
  idFoto: number;
  idEvento: number;
  nombreFoto: string;
  fechaPublicacion: string | Date;
}

export interface ResultadoAgregarEvento {
  exito: boolean;
  motivo?: "no_existe" | "invalido";
  yaExistia: boolean;
  idEvento?: number;
  nombreEvento?: string;
}

/**
 * Consulta todos los eventos autorizados para un cliente mediante la tabla accesoEvento.
 */
export async function obtenerEventosCliente(
  idCliente: number
): Promise<EventoCliente[]> {
  try {
    const sql = `
      SELECT 
        e.idEvento,
        e.idFotografo,
        e.nombreEvento,
        e.costoFoto,
        e.fechaCreacion,
        u.nombre AS nombreFotografo,
        a.fechaAcceso
      FROM accesoevento a
      INNER JOIN evento e ON a.idEvento = e.idEvento
      LEFT JOIN usuariofotografo u ON e.idFotografo = u.idFotografo
      WHERE a.idCliente = ?
      ORDER BY a.fechaAcceso DESC
    `;

    const [filas] = await conexion.execute<EventoCliente[]>(sql, [idCliente]);
    return filas;
  } catch (error) {
    console.error("Error al obtener eventos del cliente:", error);
    throw error;
  }
}

/**
 * Registra el acceso a un evento privado para un cliente mediante su claveEntrar.
 */
export async function agregarEventoCliente(
  idCliente: number,
  claveEntrar: string
): Promise<ResultadoAgregarEvento> {
  try {
    const claveLimpia = claveEntrar.trim().toUpperCase();

    if (!claveLimpia) {
      return { exito: false, motivo: "invalido", yaExistia: false };
    }

    // 1. Buscar el evento en la tabla evento por claveEntrar
    const sqlEvento = `
      SELECT idEvento, nombreEvento 
      FROM evento 
      WHERE UPPER(claveEntrar) = ? 
      LIMIT 1
    `;
    const [filasEvento] = await conexion.execute<RowDataPacket[]>(sqlEvento, [
      claveLimpia,
    ]);

    if (filasEvento.length === 0) {
      return { exito: false, motivo: "no_existe", yaExistia: false };
    }

    const idEvento = filasEvento[0].idEvento as number;
    const nombreEvento = filasEvento[0].nombreEvento as string;

    // 2. Verificar si el cliente ya tiene acceso registrado
    const sqlAccesoExistente = `
      SELECT idAcceso 
      FROM accesoevento 
      WHERE idCliente = ? AND idEvento = ? 
      LIMIT 1
    `;
    const [filasAcceso] = await conexion.execute<RowDataPacket[]>(
      sqlAccesoExistente,
      [idCliente, idEvento]
    );

    if (filasAcceso.length > 0) {
      return {
        exito: true,
        yaExistia: true,
        idEvento,
        nombreEvento,
      };
    }

    // 3. Registrar el nuevo acceso en accesoevento
    const sqlInsertar = `
      INSERT INTO accesoevento (idCliente, idEvento, fechaAcceso)
      VALUES (?, ?, NOW())
    `;
    await conexion.execute<ResultSetHeader>(sqlInsertar, [idCliente, idEvento]);

    return {
      exito: true,
      yaExistia: false,
      idEvento,
      nombreEvento,
    };
  } catch (error) {
    console.error("Error al registrar acceso a evento para cliente por clave:", error);
    throw error;
  }
}

/**
 * Verifica si el cliente tiene acceso autorizado a un evento específico.
 */
export async function verificarAccesoCliente(
  idCliente: number,
  idEvento: number
): Promise<EventoCliente | null> {
  try {
    const sql = `
      SELECT 
        e.idEvento,
        e.idFotografo,
        e.nombreEvento,
        e.costoFoto,
        e.fechaCreacion,
        u.nombre AS nombreFotografo,
        a.fechaAcceso
      FROM accesoevento a
      INNER JOIN evento e ON a.idEvento = e.idEvento
      LEFT JOIN usuariofotografo u ON e.idFotografo = u.idFotografo
      WHERE a.idCliente = ? AND a.idEvento = ?
      LIMIT 1
    `;

    const [filas] = await conexion.execute<EventoCliente[]>(sql, [
      idCliente,
      idEvento,
    ]);

    if (filas.length === 0) {
      return null;
    }

    return filas[0];
  } catch (error) {
    console.error("Error al verificar acceso de cliente a evento:", error);
    throw error;
  }
}

/**
 * Obtiene las fotografías de un evento autorizado para el cliente.
 */
export async function obtenerFotosEventoCliente(
  idCliente: number,
  idEvento: number
): Promise<{ evento: EventoCliente; fotos: FotoCliente[] } | null> {
  try {
    const evento = await verificarAccesoCliente(idCliente, idEvento);

    if (!evento) {
      return null;
    }

    const sqlFotos = `
      SELECT 
        idFoto,
        idEvento,
        nombreFoto,
        fechaPublicacion
      FROM foto
      WHERE idEvento = ?
      ORDER BY idFoto ASC
    `;

    const [fotos] = await conexion.execute<FotoCliente[]>(sqlFotos, [idEvento]);

    return { evento, fotos };
  } catch (error) {
    console.error("Error al obtener fotos de evento para cliente:", error);
    throw error;
  }
}

/**
 * Obtiene el detalle de una fotografía individual para un cliente autorizado,
 * incluyendo IDs anterior y siguiente para navegación.
 */
export async function obtenerDetalleFotoCliente(
  idCliente: number,
  idFoto: number
): Promise<{
  foto: FotoCliente;
  evento: EventoCliente;
  idFotoAnterior: number | null;
  idFotoSiguiente: number | null;
} | null> {
  try {
    // 1. Obtener la foto y su idEvento
    const sqlFoto = `
      SELECT idFoto, idEvento, nombreFoto, fechaPublicacion
      FROM foto
      WHERE idFoto = ?
      LIMIT 1
    `;
    const [filasFoto] = await conexion.execute<FotoCliente[]>(sqlFoto, [idFoto]);

    if (filasFoto.length === 0) {
      return null;
    }

    const foto = filasFoto[0];

    // 2. Verificar que el cliente tenga acceso al evento al que pertenece la foto
    const evento = await verificarAccesoCliente(idCliente, foto.idEvento);

    if (!evento) {
      return null;
    }

    // 3. Obtener todas las fotos del evento para calcular anterior y siguiente
    const sqlTodas = `
      SELECT idFoto 
      FROM foto 
      WHERE idEvento = ? 
      ORDER BY idFoto ASC
    `;
    const [todasLasFotos] = await conexion.execute<RowDataPacket[]>(sqlTodas, [
      foto.idEvento,
    ]);

    const ids = todasLasFotos.map((f) => f.idFoto as number);
    const indiceActual = ids.indexOf(idFoto);

    const idFotoAnterior = indiceActual > 0 ? ids[indiceActual - 1] : null;
    const idFotoSiguiente =
      indiceActual >= 0 && indiceActual < ids.length - 1
        ? ids[indiceActual + 1]
        : null;

    return {
      foto,
      evento,
      idFotoAnterior,
      idFotoSiguiente,
    };
  } catch (error) {
    console.error("Error al obtener detalle de foto para cliente:", error);
    throw error;
  }
}
