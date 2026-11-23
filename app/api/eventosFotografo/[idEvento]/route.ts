import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { verificarPropiedadEvento } from "@/servidor/eventos/verificarPropiedadEvento";
import { renombrarEvento } from "@/servidor/eventos/renombrarEvento";
import { eliminarEvento } from "@/servidor/eventos/eliminarEvento";
import { actualizarPrecioEvento } from "@/servidor/eventos/actualizarPrecioEvento";


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

    let datos: unknown;

    try {
      datos = await request.json();
    } catch {
      return Response.json(
        { mensaje: "Datos del evento invalidos" },
        { status: 400 }
      );
    }

    if (
      !datos ||
      typeof datos !== "object" ||
      Array.isArray(datos)
    ) {
      return Response.json(
        { mensaje: "Datos del evento invalidos" },
        { status: 400 }
      );
    }

    const contenido = datos as Record<string, unknown>;

    const editarNombre = Object.prototype.hasOwnProperty.call(
      contenido,
      "nombreEvento"
    );

    const editarPrecio = Object.prototype.hasOwnProperty.call(
      contenido,
      "costoFoto"
    );

    // Una operación por solicitud
    if (editarNombre === editarPrecio) {
      return Response.json(
        { mensaje: "Debes indicar nombreEvento o costoFoto" },
        { status: 400 }
      );
    }

    let nombreEvento = "";
    let costoFoto = 0;

    // Validación de nombre
    if (editarNombre) {
      nombreEvento =
        typeof contenido.nombreEvento === "string"
          ? contenido.nombreEvento.trim()
          : "";

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
    }

    // Validación del precio
    if (editarPrecio) {
      const valor = contenido.costoFoto;

      const textoPrecio =
        typeof valor === "number" || typeof valor === "string"
          ? String(valor).trim()
          : "";

      if (!/^\d+(?:\.\d{1,2})?$/.test(textoPrecio)) {
        return Response.json(
          { mensaje: "El precio debe tener como máximo dos decimales" },
          { status: 400 }
        );
      }

      costoFoto = Number(textoPrecio);

      if (
        !Number.isFinite(costoFoto) ||
        costoFoto < 0 ||
        costoFoto > 999999.99
      ) {
        return Response.json(
          { mensaje: "El precio debe estar entre 0 y 999999.99" },
          { status: 400 }
        );
      }
    }

    // Verificar propiedad del evento
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

    // Actualizar nombre
    if (editarNombre) {
      await renombrarEvento(
        idEvento,
        sesion.idUsuario,
        nombreEvento
      );

      return Response.json(
        {
          mensaje: "Evento renombrado correctamente",
          nombreEvento,
        },
        { status: 200 }
      );
    }

    // Actualizar precio
    await actualizarPrecioEvento(
      idEvento,
      sesion.idUsuario,
      costoFoto
    );

    return Response.json(
      {
        mensaje: "Precio actualizado correctamente",
        costoFoto,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error al modificar evento:", error);

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
