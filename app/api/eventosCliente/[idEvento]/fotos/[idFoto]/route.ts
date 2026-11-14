import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { obtenerDetalleFotoCliente } from "@/servidor/cliente/eventosCliente";

export async function GET(
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
        { mensaje: "No tienes permiso para acceder a esta seccion" },
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
        { mensaje: "Parametros de consulta invalidos" },
        { status: 400 }
      );
    }

    const resultado = await obtenerDetalleFotoCliente(
      sesion.idUsuario,
      idFoto
    );

    if (!resultado || resultado.foto.idEvento !== idEvento) {
      return Response.json(
        {
          mensaje:
            "No tienes autorizacion para consultar esta fotografia o no existe",
        },
        { status: 403 }
      );
    }

    return Response.json(resultado, { status: 200 });
  } catch (error) {
    console.error("Error al obtener detalle de foto para cliente:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
