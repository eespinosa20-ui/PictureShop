
import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { crearEvento } from "@/servidor/eventos/crearEvento";

export async function POST(request: Request) {
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
        { mensaje: "No tienes permiso para crear eventos" },
        { status: 403 }
      );
    }
    
    const datos = await request.json();
    const nombreEvento = datos.nombreEvento;
    const costoFoto = datos.costoFoto;

    if (
        typeof nombreEvento !== "string" ||
        !nombreEvento.trim() ||
        typeof costoFoto !== "number" ||
        !Number.isFinite(costoFoto) ||
        costoFoto < 0
    ) {
    return Response.json(
        { mensaje: "Datos del evento invalidos" },
        { status: 400 }
    );
    }

    const eventoCreado = await crearEvento(
        sesion.idUsuario,
        nombreEvento.trim(),
        costoFoto
    );

    return Response.json(
    {
        mensaje: "Evento creado correctamente",
        ...eventoCreado
    },
    { status: 201 }
    );

  } catch (error) {
    console.error("Error al crear evento:", error);

    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
