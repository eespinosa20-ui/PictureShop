import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { confirmarPedidoCliente } from "@/servidor/carrito/carritoCliente";
import { enviarNotificacionPedidoFotografo } from "@/servidor/correo/notificacionPedido";

export async function POST(
  _request: Request,
  context: { params: Promise<{ idEvento: string }> }
) {
  try {
    const sesion = await obtenerSesion();

    if (!sesion) {
      return Response.json(
        { mensaje: "Debes iniciar sesion" },
        { status: 401 }
      );
    }

    if (sesion.tipoUsuario !== "cliente") {
      return Response.json(
        { mensaje: "No tienes permiso para confirmar este pedido" },
        { status: 403 }
      );
    }

    const { idEvento: idEventoParam } = await context.params;
    const idEvento = Number(idEventoParam);

    if (!Number.isSafeInteger(idEvento) || idEvento <= 0) {
      return Response.json(
        { mensaje: "Identificador de evento invalido" },
        { status: 400 }
      );
    }

    const resultado = await confirmarPedidoCliente(
      sesion.idUsuario,
      idEvento
    );

    if (!resultado.exito) {
      const estado =
        resultado.motivo === "cliente_invalido"
          ? 401
          : resultado.motivo === "sin_acceso"
            ? 403
            : 409;

      return Response.json(
        { mensaje: resultado.mensaje },
        { status: estado }
      );
    }

    const notificacion = await enviarNotificacionPedidoFotografo(resultado.pedido);

    return Response.json(
      {
        mensaje: "Pedido confirmado correctamente",
        pedido: resultado.pedido,
        notificacionEnviada: notificacion.enviada,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al confirmar el pedido del cliente:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
