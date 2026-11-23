import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { quitarFotoDelCarrito } from "@/servidor/carrito/carritoCliente";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ idEvento: string; idFoto: string }> }
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

    const { idEvento: idEventoParam, idFoto: idFotoParam } =
      await context.params;
    const idEvento = Number(idEventoParam);
    const idFoto = Number(idFotoParam);

    if (
      !Number.isSafeInteger(idEvento) ||
      idEvento <= 0 ||
      !Number.isSafeInteger(idFoto) ||
      idFoto <= 0
    ) {
      return Response.json(
        { mensaje: "Parametros del carrito invalidos" },
        { status: 400 }
      );
    }

    const resultado = await quitarFotoDelCarrito(
      sesion.idUsuario,
      idEvento,
      idFoto
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

    return Response.json(
      {
        mensaje: "Fotografia quitada del carrito",
        carrito: resultado.carrito,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al quitar una fotografia del carrito:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
