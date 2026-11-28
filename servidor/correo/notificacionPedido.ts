import "server-only";
import { crearTransportador, escaparHtml, leerConfiguracionCorreo } from "./smtp";
import type { RowDataPacket } from "mysql2/promise";
import conexion from "../baseDatos/conexion";
import { formatearPrecio } from "@/app/(componentes)/utilidades/precio";
import type { PedidoConfirmado } from "../carrito/carritoCliente";

interface FilaCorreoFotografo extends RowDataPacket {
  correo: string | null;
}

export type ResultadoNotificacionPedido =
  | { enviada: true; mensaje: string }
  | {
      enviada: false;
      motivo: "sin_configuracion" | "sin_correo" | "error_envio";
      mensaje: string;
      detalle: string;
    };

function crearContenidoCorreo(pedido: PedidoConfirmado) {
  const total = formatearPrecio(pedido.montoTotal);
  const nombreFotografo = pedido.nombreFotografo?.trim() || "Fotógrafo";
  const asunto = `Nuevo pedido #${pedido.idPedido} - ${pedido.nombreEvento}`;

  const texto = [
    `Hola ${nombreFotografo},`,
    "",
    "Se ha registrado un nuevo pedido en PictureShop.",
    "",
    `Pedido: #${pedido.idPedido}`,
    `Evento: ${pedido.nombreEvento}`,
    `Cantidad de fotografías: ${pedido.cantidad}`,
    `Total: $${total}`,
    "",
    "Ponte en contacto con el cliente para coordinar el pago mediante transferencia bancaria.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #181913; line-height: 1.5;">
      <h2 style="margin: 0 0 16px;">Nuevo pedido en PictureShop</h2>
      <p>Hola ${escaparHtml(nombreFotografo)},</p>
      <p>Se ha registrado un nuevo pedido en PictureShop.</p>
      <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
        <tbody>
          <tr>
            <td><strong>Pedido</strong></td>
            <td>#${pedido.idPedido}</td>
          </tr>
          <tr>
            <td><strong>Evento</strong></td>
            <td>${escaparHtml(pedido.nombreEvento)}</td>
          </tr>
          <tr>
            <td><strong>Cantidad de fotografías</strong></td>
            <td>${pedido.cantidad}</td>
          </tr>
          <tr>
            <td><strong>Total</strong></td>
            <td>$${total}</td>
          </tr>
        </tbody>
      </table>
      <p>Ponte en contacto con el cliente para coordinar el pago mediante transferencia bancaria.</p>
    </div>
  `;

  return { asunto, texto, html };
}

/**
 * Notifica al fotógrafo después de confirmar la transacción en MySQL.
 */
export async function enviarNotificacionPedidoFotografo(
  pedido: PedidoConfirmado
): Promise<ResultadoNotificacionPedido> {
  const { configuracion, faltantes } = leerConfiguracionCorreo();

  if (!configuracion) {
    const detalle = `Falta configurar: ${faltantes.join(", ")}`;
    console.warn(`No se envio la notificacion del pedido #${pedido.idPedido}. ${detalle}`);
    return {
      enviada: false,
      motivo: "sin_configuracion",
      mensaje:
        "El pedido fue registrado, pero la notificación al fotógrafo quedó pendiente porque el correo no está configurado.",
      detalle,
    };
  }

  let correoFotografo = "";

  try {
    const [filas] = await conexion.execute<FilaCorreoFotografo[]>(
      `
        SELECT uf.correo
        FROM evento e
        INNER JOIN usuariofotografo uf ON uf.idFotografo = e.idFotografo
        WHERE e.idEvento = ?
        LIMIT 1
      `,
      [pedido.idEvento]
    );

    correoFotografo = filas[0]?.correo?.trim() ?? "";
  } catch (error) {
    console.error(
      `Error al consultar el correo del fotografo para el pedido #${pedido.idPedido}:`,
      error
    );

    return {
      enviada: false,
      motivo: "error_envio",
      mensaje:
        "El pedido fue registrado, pero no se pudo consultar el correo del fotógrafo. La notificación quedó pendiente.",
      detalle: error instanceof Error ? error.message : String(error),
    };
  }

  if (!correoFotografo) {
    console.warn(
      `No se envio la notificacion del pedido #${pedido.idPedido}: el fotografo no tiene correo registrado.`
    );

    return {
      enviada: false,
      motivo: "sin_correo",
      mensaje:
        "El pedido fue registrado, pero el fotógrafo no tiene un correo registrado. La notificación quedó pendiente.",
      detalle: "El fotógrafo no tiene correo registrado.",
    };
  }

  try {
    const { asunto, texto, html } = crearContenidoCorreo(pedido);
    const transportador = crearTransportador(configuracion);

    await transportador.sendMail({
      from: configuracion.from,
      to: correoFotografo,
      subject: asunto,
      text: texto,
      html,
    });

    return {
      enviada: true,
      mensaje: "Notificación enviada al fotógrafo por correo electrónico.",
    };
  } catch (error) {
    console.error(
      `Error al enviar la notificacion del pedido #${pedido.idPedido}:`,
      error
    );

    return {
      enviada: false,
      motivo: "error_envio",
      mensaje:
        "El pedido fue registrado, pero no se pudo enviar la notificación al fotógrafo. La notificación quedó pendiente.",
      detalle: error instanceof Error ? error.message : String(error),
    };
  }
}
