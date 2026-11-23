import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { verificarPropiedadEvento } from "@/servidor/eventos/verificarPropiedadEvento";
import { obtenerFotosEvento } from "@/servidor/fotos/obtenerFotosEvento";
import { procesarYGuardarFotografia } from "@/servidor/fotos/guardarFotografia";
import { extensionPermitida, fotosPorLote, maximoBytesFoto } from "@/app/(componentes)/fotografias/limitesCarga";

const maximoBytesLote = fotosPorLote * maximoBytesFoto + 1024 * 1024;

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

    if (Number(request.headers.get("content-length")) > maximoBytesLote) {
      return Response.json({ mensaje: "El lote de fotografías es demasiado grande." }, { status: 413 });
    }
    let bytesRecibidos = 0;
    const cuerpo = request.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(fragmento, control) {
        bytesRecibidos += fragmento.byteLength;
        if (bytesRecibidos > maximoBytesLote) {
          control.error(new Error("El lote de fotografías es demasiado grande."));
        } else {
          control.enqueue(fragmento);
        }
      },
    }));
    const formData = await new Response(cuerpo, { headers: request.headers }).formData().catch(() => null);
    if (bytesRecibidos > maximoBytesLote) {
      return Response.json({ mensaje: "El lote de fotografías es demasiado grande." }, { status: 413 });
    }
    if (!formData) {
      return Response.json({ mensaje: "El formulario de carga no es válido." }, { status: 400 });
    }
    const archivos = formData.getAll("fotos");

    if (!archivos.length || archivos.length > fotosPorLote || archivos.some((archivo) => !(archivo instanceof File))) {
      return Response.json(
        { mensaje: `Selecciona entre 1 y ${fotosPorLote} fotografías por lote.` },
        { status: 400 }
      );
    }

    const fallidas: { indice: number; nombre: string; motivo: string }[] = [];
    const cargaParcial = formData.get("cargaParcial") === "1";
    let cantidad = 0;

    for (const [indice, archivo] of (archivos as File[]).entries()) {
      let motivo = "";
      if (!extensionPermitida(archivo.name)) {
        motivo = "Formato no permitido.";
      } else if (!archivo.size || archivo.size > maximoBytesFoto) {
        motivo = "El archivo está vacío o supera los 25 MB.";
      } else {
        try {
          await procesarYGuardarFotografia(idEvento, Buffer.from(await archivo.arrayBuffer()), archivo.name);
          cantidad++;
        } catch (error) {
          console.error("Error al guardar una fotografía del evento:", error);
          motivo = "No se pudo procesar o guardar la imagen.";
        }
      }

      if (motivo) {
        fallidas.push({ indice, nombre: archivo.name, motivo });
        if (!cargaParcial) break;
      }
    }

    const primeraFalla = fallidas[0];
    return Response.json(
      {
        mensaje: primeraFalla
          ? `${primeraFalla.nombre}: ${primeraFalla.motivo}`
          : "Fotografías procesadas y guardadas correctamente",
        cantidad,
        fallidas,
      },
      { status: primeraFalla && (!cargaParcial || !cantidad) ? 422 : 201 }
    );
  } catch (error) {
    console.error("Error al procesar fotografías:", error);

    return Response.json(
      {
        mensaje: "Error al procesar fotografías",
      },
      { status: 500 }
    );
  }
}

