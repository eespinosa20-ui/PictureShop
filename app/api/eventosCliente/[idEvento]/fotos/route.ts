import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { obtenerFotosEventoCliente } from "@/servidor/cliente/eventosCliente";

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
        { mensaje: "No tienes permiso para acceder a esta seccion" },
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

    const resultado = await obtenerFotosEventoCliente(
      sesion.idUsuario,
      idEvento
    );

    if (!resultado) {
      return Response.json(
        {
          mensaje:
            "No tienes autorizacion para consultar este evento o el evento no existe",
        },
        { status: 403 }
      );
    }

    return Response.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Error al obtener fotos de evento para cliente:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
