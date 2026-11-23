import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { agregarFotoAlCarrito } from "@/servidor/carrito/carritoCliente";

export async function POST(
  request: Request,
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
        { mensaje: "No tienes permiso para modificar este carrito" },
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

    let datos: { idFoto?: unknown };

    try {
      datos = (await request.json()) as { idFoto?: unknown };
    } catch {
      return Response.json(
        { mensaje: "Datos del carrito invalidos" },
        { status: 400 }
      );
    }

    const idFoto = typeof datos?.idFoto === "number" ? datos.idFoto : NaN;

    if (!Number.isSafeInteger(idFoto) || idFoto <= 0) {
      return Response.json(
        { mensaje: "Identificador de fotografia invalido" },
        { status: 400 }
      );
    }

    const resultado = await agregarFotoAlCarrito(
      sesion.idUsuario,
      idEvento,
      idFoto
    );

    if (!resultado.exito) {
      return Response.json(
        { mensaje: resultado.mensaje },
        { status: resultado.motivo === "cliente_invalido" ? 401 : 403 }
      );
    }

    return Response.json(
      {
        mensaje: resultado.yaExistia
          ? "La fotografia ya esta en el carrito"
          : "Fotografia agregada al carrito",
        yaExistia: resultado.yaExistia,
        carrito: resultado.carrito,
      },
      { status: resultado.yaExistia ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error al agregar una fotografia al carrito:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
