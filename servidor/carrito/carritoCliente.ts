import "server-only";
import conexion from "../baseDatos/conexion";
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

export interface FotoCarrito {
  idFoto: number;
  idEvento: number;
  nombreFoto: string;
  fechaPublicacion: string | Date;
  costoFoto: string;
}

export interface CarritoCliente {
  idCarrito: number | null;
  idEvento: number;
  nombreEvento: string;
  nombreFotografo: string | null;
  costoFoto: string;
  fotos: FotoCarrito[];
  cantidad: number;
  total: string;
}

export interface FotoPedido {
  idFoto: number;
  nombreFoto: string;
  fechaPublicacion: string | Date;
  precioUnitario: string;
}

export interface PedidoConfirmado {
  idPedido: number;
  idEvento: number;
  nombreEvento: string;
  nombreFotografo: string | null;
  montoTotal: string;
  estadoPedido: "pendiente" | "desbloqueado" | "cancelado";
  fechaCreacion: string | Date;
  cantidad: number;
  fotos: FotoPedido[];
}

export interface ResumenCarritoActual {
  idEvento: number;
  cantidad: number;
}

export type ResultadoAgregarFoto =
  | { exito: true; yaExistia: boolean; carrito: CarritoCliente }
  | {
      exito: false;
      motivo: "sin_acceso" | "foto_invalida" | "cliente_invalido";
      mensaje: string;
    };

export type ResultadoQuitarFoto =
  | { exito: true; carrito: CarritoCliente }
  | {
      exito: false;
      motivo:
        | "sin_acceso"
        | "cliente_invalido"
        | "sin_carrito"
        | "foto_no_en_carrito";
      mensaje: string;
    };

export type ResultadoConfirmarPedido =
  | { exito: true; pedido: PedidoConfirmado }
  | {
      exito: false;
      motivo: "sin_acceso" | "cliente_invalido" | "carrito_vacio";
      mensaje: string;
    };

interface FilaEvento extends RowDataPacket {
  idEvento: number;
  nombreEvento: string;
  nombreFotografo: string | null;
  costoFoto: string;
}

interface FilaFotoCarrito extends RowDataPacket {
  idFoto: number;
  idEvento: number;
  nombreFoto: string;
  fechaPublicacion: string | Date;
  costoFoto: string;
}

interface FilaCarrito extends RowDataPacket {
  idCarrito: number;
}

interface FilaResumenCarrito extends RowDataPacket {
  idEvento: number;
  cantidad: number | string;
}

interface FilaTotales extends RowDataPacket {
  cantidad: number | string;
  total: string;
}

interface FilaFotoPedido extends RowDataPacket {
  idFoto: number;
  nombreFoto: string;
  fechaPublicacion: string | Date;
  precioUnitario: string;
}

interface FilaPedido extends RowDataPacket {
  idPedido: number;
  idEvento: number;
  montoTotal: string;
  estadoPedido: "pendiente" | "desbloqueado" | "cancelado";
  fechaCreacion: string | Date;
}

type Ejecutor = Pool | PoolConnection;

function esErrorDuplicado(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const codigo = (error as { code?: unknown }).code;
  const numero = (error as { errno?: unknown }).errno;

  return codigo === "ER_DUP_ENTRY" || numero === 1062;
}

async function bloquearCliente(
  ejecutor: Ejecutor,
  idCliente: number
): Promise<boolean> {
  const [filas] = await ejecutor.execute<RowDataPacket[]>(
    "SELECT idCliente FROM usuariocliente WHERE idCliente = ? FOR UPDATE",
    [idCliente]
  );

  return filas.length > 0;
}

async function obtenerEventoAutorizado(
  ejecutor: Ejecutor,
  idCliente: number,
  idEvento: number,
  bloquear = false
): Promise<FilaEvento | null> {
  const sql = `
    SELECT
      e.idEvento,
      e.nombreEvento,
      CAST(e.costoFoto AS CHAR) AS costoFoto,
      uf.nombre AS nombreFotografo
    FROM evento e
    INNER JOIN accesoevento a
      ON a.idEvento = e.idEvento AND a.idCliente = ?
    LEFT JOIN usuariofotografo uf ON uf.idFotografo = e.idFotografo
    WHERE e.idEvento = ?
    LIMIT 1
    ${bloquear ? "FOR UPDATE" : ""}
  `;

  const [filas] = await ejecutor.execute<FilaEvento[]>(sql, [
    idCliente,
    idEvento,
  ]);

  return filas.length > 0 ? filas[0] : null;
}

async function leerCarrito(
  ejecutor: Ejecutor,
  idCarrito: number,
  idEvento: number,
  evento: FilaEvento
): Promise<CarritoCliente> {
  const [fotos] = await ejecutor.execute<FilaFotoCarrito[]>(
    `
      SELECT
        f.idFoto,
        f.idEvento,
        f.nombreFoto,
        f.fechaPublicacion,
        CAST(e.costoFoto AS CHAR) AS costoFoto
      FROM detallecarrito dc
      INNER JOIN foto f ON f.idFoto = dc.idFoto
      INNER JOIN evento e ON e.idEvento = f.idEvento
      WHERE dc.idCarrito = ? AND f.idEvento = ?
      ORDER BY dc.idDetalleCarrito ASC
    `,
    [idCarrito, idEvento]
  );

  const [totales] = await ejecutor.execute<FilaTotales[]>(
    `
      SELECT
        COUNT(*) AS cantidad,
        COALESCE(CAST(SUM(e.costoFoto) AS CHAR), '0.00') AS total
      FROM detallecarrito dc
      INNER JOIN foto f ON f.idFoto = dc.idFoto
      INNER JOIN evento e ON e.idEvento = f.idEvento
      WHERE dc.idCarrito = ? AND f.idEvento = ?
    `,
    [idCarrito, idEvento]
  );

  const resumen = totales[0];

  return {
    idCarrito,
    idEvento: evento.idEvento,
    nombreEvento: evento.nombreEvento,
    nombreFotografo: evento.nombreFotografo,
    costoFoto: String(evento.costoFoto),
    fotos: fotos.map((foto) => ({
      idFoto: foto.idFoto,
      idEvento: foto.idEvento,
      nombreFoto: foto.nombreFoto,
      fechaPublicacion: foto.fechaPublicacion,
      costoFoto: String(foto.costoFoto),
    })),
    cantidad: Number(resumen?.cantidad ?? 0),
    total: String(resumen?.total ?? "0.00"),
  };
}

/**
 * Obtiene el carrito mas reciente del cliente entre sus eventos autorizados.
 * Se usa solo para el acceso global del encabezado.
 */
export async function obtenerResumenCarritoActual(
  idCliente: number
): Promise<ResumenCarritoActual | null> {
  try {
    const [filas] = await conexion.execute<FilaResumenCarrito[]>(
      `
        SELECT c.idEvento, COUNT(dc.idFoto) AS cantidad
        FROM carrito c
        INNER JOIN accesoevento a
          ON a.idEvento = c.idEvento AND a.idCliente = c.idCliente
        LEFT JOIN detallecarrito dc ON dc.idCarrito = c.idCarrito
        WHERE c.idCliente = ?
        GROUP BY c.idCarrito, c.idEvento
        ORDER BY c.idCarrito DESC
        LIMIT 1
      `,
      [idCliente]
    );

    if (filas.length === 0) {
      return null;
    }

    return {
      idEvento: Number(filas[0].idEvento),
      cantidad: Number(filas[0].cantidad),
    };
  } catch (error) {
    console.error("Error al obtener el resumen del carrito actual:", error);
    throw error;
  }
}

/**
 * Obtiene el carrito mas reciente del cliente para un evento autorizado.
 * Devuelve null cuando el cliente no tiene acceso al evento.
 */
export async function obtenerCarritoCliente(
  idCliente: number,
  idEvento: number
): Promise<CarritoCliente | null> {
  try {
    const evento = await obtenerEventoAutorizado(conexion, idCliente, idEvento);

    if (!evento) {
      return null;
    }

    const [carritos] = await conexion.execute<FilaCarrito[]>(
      `
        SELECT idCarrito
        FROM carrito
        WHERE idCliente = ? AND idEvento = ?
        ORDER BY idCarrito DESC
        LIMIT 1
      `,
      [idCliente, idEvento]
    );

    if (carritos.length === 0) {
      return {
        idCarrito: null,
        idEvento: evento.idEvento,
        nombreEvento: evento.nombreEvento,
        nombreFotografo: evento.nombreFotografo,
        costoFoto: String(evento.costoFoto),
        fotos: [],
        cantidad: 0,
        total: "0.00",
      };
    }

    return leerCarrito(conexion, carritos[0].idCarrito, idEvento, evento);
  } catch (error) {
    console.error("Error al obtener el carrito del cliente:", error);
    throw error;
  }
}

/**
 * Agrega una fotografia al carrito del cliente para el evento indicado.
 * La fila del cliente se bloquea para impedir carritos paralelos. El unico
 * duplicado admitido es la misma fotografia dentro del mismo carrito, que se
 * trata como una operacion idempotente.
 */
export async function agregarFotoAlCarrito(
  idCliente: number,
  idEvento: number,
  idFoto: number
): Promise<ResultadoAgregarFoto> {
  const conexionTransaccion = await conexion.getConnection();

  try {
    await conexionTransaccion.beginTransaction();

    if (!(await bloquearCliente(conexionTransaccion, idCliente))) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "cliente_invalido",
        mensaje: "La sesion del cliente no es valida",
      };
    }

    const evento = await obtenerEventoAutorizado(
      conexionTransaccion,
      idCliente,
      idEvento,
      true
    );

    if (!evento) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "sin_acceso",
        mensaje: "No tienes autorizacion para usar el carrito de este evento",
      };
    }

    const [fotos] = await conexionTransaccion.execute<RowDataPacket[]>(
      "SELECT idFoto FROM foto WHERE idFoto = ? AND idEvento = ? LIMIT 1",
      [idFoto, idEvento]
    );

    if (fotos.length === 0) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "foto_invalida",
        mensaje: "La fotografia no pertenece al evento indicado",
      };
    }

    const [carritos] = await conexionTransaccion.execute<FilaCarrito[]>(
      `
        SELECT idCarrito
        FROM carrito
        WHERE idCliente = ? AND idEvento = ?
        ORDER BY idCarrito DESC
        LIMIT 1
        FOR UPDATE
      `,
      [idCliente, idEvento]
    );

    let idCarrito: number;

    if (carritos.length > 0) {
      idCarrito = carritos[0].idCarrito;
    } else {
      const [resultado] = await conexionTransaccion.execute<ResultSetHeader>(
        "INSERT INTO carrito (idCliente, idEvento) VALUES (?, ?)",
        [idCliente, idEvento]
      );

      idCarrito = resultado.insertId;
    }

    let yaExistia = false;

    try {
      await conexionTransaccion.execute<ResultSetHeader>(
        "INSERT INTO detallecarrito (idCarrito, idFoto) VALUES (?, ?)",
        [idCarrito, idFoto]
      );
    } catch (error) {
      if (!esErrorDuplicado(error)) {
        throw error;
      }

      yaExistia = true;
    }

    const carrito = await leerCarrito(
      conexionTransaccion,
      idCarrito,
      idEvento,
      evento
    );

    await conexionTransaccion.commit();

    return { exito: true, yaExistia, carrito };
  } catch (error) {
    try {
      await conexionTransaccion.rollback();
    } catch (errorRollback) {
      console.error("Error al revertir la transaccion de carrito:", errorRollback);
    }

    throw error;
  } finally {
    conexionTransaccion.release();
  }
}

/**
 * Quita una fotografia del carrito del cliente sin afectar la tabla foto ni
 * los archivos almacenados.
 */
export async function quitarFotoDelCarrito(
  idCliente: number,
  idEvento: number,
  idFoto: number
): Promise<ResultadoQuitarFoto> {
  const conexionTransaccion = await conexion.getConnection();

  try {
    await conexionTransaccion.beginTransaction();

    if (!(await bloquearCliente(conexionTransaccion, idCliente))) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "cliente_invalido",
        mensaje: "La sesion del cliente no es valida",
      };
    }

    const evento = await obtenerEventoAutorizado(
      conexionTransaccion,
      idCliente,
      idEvento,
      true
    );

    if (!evento) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "sin_acceso",
        mensaje: "No tienes autorizacion para usar el carrito de este evento",
      };
    }

    const [carritos] = await conexionTransaccion.execute<FilaCarrito[]>(
      `
        SELECT idCarrito
        FROM carrito
        WHERE idCliente = ? AND idEvento = ?
        ORDER BY idCarrito DESC
        LIMIT 1
        FOR UPDATE
      `,
      [idCliente, idEvento]
    );

    if (carritos.length === 0) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "sin_carrito",
        mensaje: "El carrito esta vacio",
      };
    }

    const [resultado] = await conexionTransaccion.execute<ResultSetHeader>(
      `
        DELETE dc
        FROM detallecarrito dc
        INNER JOIN foto f ON f.idFoto = dc.idFoto
        WHERE dc.idCarrito = ? AND dc.idFoto = ? AND f.idEvento = ?
      `,
      [carritos[0].idCarrito, idFoto, idEvento]
    );

    if (resultado.affectedRows === 0) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "foto_no_en_carrito",
        mensaje: "La fotografia no se encuentra en el carrito",
      };
    }

    const carrito = await leerCarrito(
      conexionTransaccion,
      carritos[0].idCarrito,
      idEvento,
      evento
    );

    await conexionTransaccion.commit();

    return { exito: true, carrito };
  } catch (error) {
    try {
      await conexionTransaccion.rollback();
    } catch (errorRollback) {
      console.error("Error al revertir la transaccion de carrito:", errorRollback);
    }

    throw error;
  } finally {
    conexionTransaccion.release();
  }
}

/**
 * Confirma el carrito activo creando el pedido y sus detalles en una sola
 * transaccion. El carrito se elimina al confirmar correctamente.
 */
export async function confirmarPedidoCliente(
  idCliente: number,
  idEvento: number
): Promise<ResultadoConfirmarPedido> {
  const conexionTransaccion = await conexion.getConnection();

  try {
    await conexionTransaccion.beginTransaction();

    if (!(await bloquearCliente(conexionTransaccion, idCliente))) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "cliente_invalido",
        mensaje: "La sesion del cliente no es valida",
      };
    }

    const evento = await obtenerEventoAutorizado(
      conexionTransaccion,
      idCliente,
      idEvento,
      true
    );

    if (!evento) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "sin_acceso",
        mensaje: "No tienes autorizacion para confirmar este pedido",
      };
    }

    const [carritos] = await conexionTransaccion.execute<FilaCarrito[]>(
      `
        SELECT idCarrito
        FROM carrito
        WHERE idCliente = ? AND idEvento = ?
        ORDER BY idCarrito DESC
        LIMIT 1
        FOR UPDATE
      `,
      [idCliente, idEvento]
    );

    if (carritos.length === 0) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "carrito_vacio",
        mensaje: "El carrito esta vacio",
      };
    }

    const idCarrito = carritos[0].idCarrito;

    const [fotos] = await conexionTransaccion.execute<FilaFotoPedido[]>(
      `
        SELECT
          f.idFoto,
          f.nombreFoto,
          f.fechaPublicacion,
          CAST(e.costoFoto AS CHAR) AS precioUnitario
        FROM detallecarrito dc
        INNER JOIN foto f ON f.idFoto = dc.idFoto
        INNER JOIN evento e ON e.idEvento = f.idEvento
        WHERE dc.idCarrito = ? AND f.idEvento = ?
        ORDER BY dc.idDetalleCarrito ASC
      `,
      [idCarrito, idEvento]
    );

    if (fotos.length === 0) {
      await conexionTransaccion.rollback();
      return {
        exito: false,
        motivo: "carrito_vacio",
        mensaje: "El carrito esta vacio",
      };
    }

    const [totales] = await conexionTransaccion.execute<FilaTotales[]>(
      `
        SELECT
          COUNT(*) AS cantidad,
          COALESCE(CAST(SUM(e.costoFoto) AS CHAR), '0.00') AS total
        FROM detallecarrito dc
        INNER JOIN foto f ON f.idFoto = dc.idFoto
        INNER JOIN evento e ON e.idEvento = f.idEvento
        WHERE dc.idCarrito = ? AND f.idEvento = ?
      `,
      [idCarrito, idEvento]
    );

    const montoTotal = String(totales[0]?.total ?? "0.00");

    const [pedidoInsertado] =
      await conexionTransaccion.execute<ResultSetHeader>(
        `
          INSERT INTO pedido (idCliente, idEvento, montoTotal, estadoPedido)
          VALUES (?, ?, ?, 'pendiente')
        `,
        [idCliente, idEvento, montoTotal]
      );

    const idPedido = pedidoInsertado.insertId;

    for (const foto of fotos) {
      await conexionTransaccion.execute<ResultSetHeader>(
        `
          INSERT INTO detallepedido (idPedido, idFoto, precioUnitario)
          VALUES (?, ?, ?)
        `,
        [idPedido, foto.idFoto, String(foto.precioUnitario)]
      );
    }

    await conexionTransaccion.execute(
      "DELETE FROM detallecarrito WHERE idCarrito = ?",
      [idCarrito]
    );

    await conexionTransaccion.execute(
      "DELETE FROM carrito WHERE idCarrito = ?",
      [idCarrito]
    );

    const [pedidos] = await conexionTransaccion.execute<FilaPedido[]>(
      `
        SELECT
          idPedido,
          idEvento,
          CAST(montoTotal AS CHAR) AS montoTotal,
          estadoPedido,
          fechaCreacion
        FROM pedido
        WHERE idPedido = ? AND idCliente = ?
        LIMIT 1
      `,
      [idPedido, idCliente]
    );

    if (pedidos.length === 0) {
      throw new Error("No se pudo leer el pedido creado");
    }

    const pedidoCreado = pedidos[0];

    const pedido: PedidoConfirmado = {
      idPedido,
      idEvento,
      nombreEvento: evento.nombreEvento,
      nombreFotografo: evento.nombreFotografo,
      montoTotal: String(pedidoCreado.montoTotal),
      estadoPedido: pedidoCreado.estadoPedido,
      fechaCreacion: pedidoCreado.fechaCreacion,
      cantidad: fotos.length,
      fotos: fotos.map((foto) => ({
        idFoto: foto.idFoto,
        nombreFoto: foto.nombreFoto,
        fechaPublicacion: foto.fechaPublicacion,
        precioUnitario: String(foto.precioUnitario),
      })),
    };

    await conexionTransaccion.commit();

    return { exito: true, pedido };
  } catch (error) {
    try {
      await conexionTransaccion.rollback();
    } catch (errorRollback) {
      console.error(
        "Error al revertir la transaccion de confirmacion de pedido:",
        errorRollback
      );
    }

    throw error;
  } finally {
    conexionTransaccion.release();
  }
}
