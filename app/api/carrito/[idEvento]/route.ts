import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { obtenerCarritoCliente } from "@/servidor/carrito/carritoCliente";

export async function GET(
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
        { mensaje: "No tienes permiso para consultar este carrito" },
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

    const carrito = await obtenerCarritoCliente(
      sesion.idUsuario,
      idEvento
    );

    if (!carrito) {
      return Response.json(
        { mensaje: "No tienes autorizacion para acceder a este carrito" },
        { status: 403 }
      );
    }

    return Response.json({ carrito }, { status: 200 });
  } catch (error) {
    console.error("Error al consultar el carrito del cliente:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
