import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import conexion from "../baseDatos/conexion";

type EstadoPedido = "pendiente" | "desbloqueado" | "cancelado";

export interface CompraMomentos {
  idEvento: number;
  nombreEvento: string;
  idPedido: number;
  fechaPedido: string;
  estadoPedido: EstadoPedido;
  idFoto: number;
  nombreFoto: string;
  tieneVistaPrevia: boolean;
}

interface FilaCompra extends RowDataPacket, Omit<CompraMomentos, "tieneVistaPrevia"> {
  tieneVistaPrevia: number;
}

interface FilaClave extends RowDataPacket {
  estadoPedido: EstadoPedido;
  claveVerificacionPago: string;
}

interface OriginalComprado extends RowDataPacket {
  idFoto: number;
  idEvento: number;
  nombreFoto: string | null;
  ubicacionArchivo: string | null;
}

export async function obtenerComprasMomentos(idCliente: number): Promise<CompraMomentos[]> {
  const [filas] = await conexion.execute<FilaCompra[]>(
    `SELECT p.idEvento, e.nombreEvento, p.idPedido, p.estadoPedido,
            DATE_FORMAT(p.fechaCreacion, '%d/%m/%Y') AS fechaPedido,
            f.idFoto, f.nombreFoto, NULLIF(f.ubicacionVistaPrevia, '') IS NOT NULL AS tieneVistaPrevia
     FROM pedido p
     INNER JOIN evento e ON e.idEvento = p.idEvento
     INNER JOIN detallepedido d ON d.idPedido = p.idPedido
     INNER JOIN foto f ON f.idFoto = d.idFoto AND f.idEvento = p.idEvento
     WHERE p.idCliente = ?
     ORDER BY p.idPedido DESC, f.idFoto`,
    [idCliente]
  );
  return filas.map((fila) => ({ ...fila, tieneVistaPrevia: Boolean(fila.tieneVistaPrevia) }));
}

export async function verificarPagoPedido(idCliente: number, idPedido: number, clave: string) {
  const [filas] = await conexion.execute<FilaClave[]>(
    `SELECT p.estadoPedido, e.claveVerificacionPago
     FROM pedido p INNER JOIN evento e ON e.idEvento = p.idEvento
     WHERE p.idPedido = ? AND p.idCliente = ?`,
    [idPedido, idCliente]
  );
  const pedido = filas[0];
  if (!pedido) return "no_encontrado";
  if (pedido.estadoPedido === "cancelado") return "no_disponible";

  const resumir = (valor: string) => createHash("sha256").update(valor).digest();
  if (!timingSafeEqual(resumir(clave), resumir(pedido.claveVerificacionPago))) {
    return "clave_incorrecta";
  }
  if (pedido.estadoPedido === "desbloqueado") return "verificado";

  const [resultado] = await conexion.execute<ResultSetHeader>(
    `UPDATE pedido p INNER JOIN evento e ON e.idEvento = p.idEvento
     SET p.estadoPedido = 'desbloqueado'
     WHERE p.idPedido = ? AND p.idCliente = ?
       AND p.estadoPedido IN ('pendiente', 'desbloqueado')
       AND CAST(e.claveVerificacionPago AS BINARY) = CAST(? AS BINARY)`,
    [idPedido, idCliente, clave]
  );
  return resultado.affectedRows ? "verificado" : "no_disponible";
}

export async function obtenerOriginalesComprados(idCliente: number, idPedido: number, idFoto?: number) {
  const [filas] = await conexion.execute<OriginalComprado[]>(
    `SELECT DISTINCT d.idFoto, p.idEvento, f.nombreFoto, f.ubicacionArchivo
     FROM pedido p
     INNER JOIN detallepedido d ON d.idPedido = p.idPedido
     LEFT JOIN foto f ON f.idFoto = d.idFoto AND f.idEvento = p.idEvento
     WHERE p.idCliente = ? AND p.idPedido = ?
       AND p.estadoPedido = 'desbloqueado'
       ${idFoto === undefined ? "" : "AND d.idFoto = ?"}
     ORDER BY d.idFoto`,
    idFoto === undefined ? [idCliente, idPedido] : [idCliente, idPedido, idFoto]
  );
  return filas;
}
