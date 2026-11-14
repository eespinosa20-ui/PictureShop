import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { verificarPropiedadEvento } from "@/servidor/eventos/verificarPropiedadEvento";
import { obtenerFotosEvento } from "@/servidor/fotos/obtenerFotosEvento";
import { procesarYGuardarFotografia } from "@/servidor/fotos/guardarFotografia";

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

    if (sesion.tipoUsuario !== "fotografo") {
      return Response.json(
        { mensaje: "No tienes permiso para acceder" },
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
        { mensaje: "No tienes permiso para ver este evento" },
        { status: 403 }
      );
    }

    const fotos = await obtenerFotosEvento(idEvento);

    return Response.json(
      {
        evento: verificacion.evento,
        fotos,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener fotos del evento:", error);

    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

    if (sesion.tipoUsuario !== "fotografo") {
      return Response.json(
        { mensaje: "No tienes permiso para cargar fotos" },
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
        { mensaje: "No tienes permiso para cargar fotos en este evento" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const archivos = formData.getAll("fotos");

    if (!archivos || archivos.length === 0) {
      return Response.json(
        { mensaje: "No se seleccionaron archivos" },
        { status: 400 }
      );
    }

    const fotosGuardadas = [];

    for (const archivo of archivos) {
      if (!(archivo instanceof File)) {
        continue;
      }

      const bytes = await archivo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fotoGuardada = await procesarYGuardarFotografia(
        idEvento,
        buffer,
        archivo.name
      );

      fotosGuardadas.push(fotoGuardada);
    }

    return Response.json(
      {
        mensaje: "Fotografías procesadas y guardadas correctamente",
        cantidad: fotosGuardadas.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al procesar fotografías:", error);

    return Response.json(
      {
        mensaje:
          error instanceof Error
            ? error.message
            : "Error al procesar fotografías",
      },
      { status: 500 }
    );
  }
}

