import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { verificarPropiedadEvento } from "@/servidor/eventos/verificarPropiedadEvento";
import { eliminarEventoIncompleto } from "@/servidor/eventos/eliminarEventoIncompleto";

export async function DELETE(
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

    if (sesion.tipoUsuario !== "fotografo") {
      return Response.json(
        { mensaje: "No tienes permiso para realizar esta operacion" },
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

    const verificacion = await verificarPropiedadEvento(
      idEvento,
      sesion.idUsuario
    );

    if (!verificacion.existe) {
      return Response.json(
        { mensaje: "Evento no encontrado" },
        { status: 404 }
      );
    }

    if (!verificacion.autorizado) {
      return Response.json(
        { mensaje: "No tienes permiso para modificar este evento" },
        { status: 403 }
      );
    }

    await eliminarEventoIncompleto(idEvento, sesion.idUsuario);

    return Response.json(
      { mensaje: "Evento cancelado y eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al cancelar evento:", error);

    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
