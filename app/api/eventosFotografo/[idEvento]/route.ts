import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { verificarPropiedadEvento } from "@/servidor/eventos/verificarPropiedadEvento";
import { renombrarEvento } from "@/servidor/eventos/renombrarEvento";
import { eliminarEvento } from "@/servidor/eventos/eliminarEvento";

export async function PATCH(
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

    let datos: { nombreEvento?: unknown };

    try {
      datos = (await request.json()) as { nombreEvento?: unknown };
    } catch {
      return Response.json(
        { mensaje: "Datos del evento invalidos" },
        { status: 400 }
      );
    }

    const nombreEvento =
      typeof datos?.nombreEvento === "string" ? datos.nombreEvento.trim() : "";

    if (!nombreEvento) {
      return Response.json(
        { mensaje: "El nombre del evento no puede estar vacio" },
        { status: 400 }
      );
    }

    if (nombreEvento.length > 120) {
      return Response.json(
        { mensaje: "El nombre del evento no puede superar 120 caracteres" },
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

    await renombrarEvento(idEvento, sesion.idUsuario, nombreEvento);

    return Response.json(
      {
        mensaje: "Evento renombrado correctamente",
        nombreEvento,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al renombrar evento:", error);

    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

    const resultado = await eliminarEvento(idEvento, sesion.idUsuario);

    if (!resultado.eliminado) {
      if (resultado.motivo === "no_existe") {
        return Response.json(
          { mensaje: "Evento no encontrado" },
          { status: 404 }
        );
      }

      return Response.json(
        {
          mensaje:
            "No se puede eliminar el evento porque tiene pedidos asociados",
          cantidadPedidos: resultado.cantidadPedidos ?? 0,
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        mensaje: "Evento eliminado correctamente",
        ...(resultado.advertencia
          ? { advertencia: resultado.advertencia }
          : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar evento:", error);

    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
