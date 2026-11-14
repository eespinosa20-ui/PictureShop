import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import {
  obtenerEventosCliente,
  agregarEventoCliente,
} from "@/servidor/cliente/eventosCliente";

export async function GET() {
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
        { mensaje: "No tienes permiso para consultar eventos de cliente" },
        { status: 403 }
      );
    }

    const eventos = await obtenerEventosCliente(sesion.idUsuario);

    return Response.json({ eventos }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener eventos del cliente:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
        { mensaje: "Solo los clientes pueden agregar eventos" },
        { status: 403 }
      );
    }

    const datos = await request.json();
    const claveEntrar =
      typeof datos.claveEntrar === "string" ? datos.claveEntrar.trim() : "";

    if (!claveEntrar) {
      return Response.json(
        { mensaje: "Debes ingresar una clave de acceso válida" },
        { status: 400 }
      );
    }

    const resultado = await agregarEventoCliente(
      sesion.idUsuario,
      claveEntrar
    );

    if (!resultado.exito) {
      return Response.json(
        { mensaje: "No se encontró ningún evento con esa clave de acceso" },
        { status: 404 }
      );
    }

    if (resultado.yaExistia) {
      return Response.json(
        {
          mensaje: "El evento ya se encuentra en tu lista de eventos agregados",
          yaExistia: true,
          idEvento: resultado.idEvento,
          nombreEvento: resultado.nombreEvento,
        },
        { status: 200 }
      );
    }

    return Response.json(
      {
        mensaje: "Evento agregado exitosamente",
        yaExistia: false,
        idEvento: resultado.idEvento,
        nombreEvento: resultado.nombreEvento,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al agregar evento para cliente:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
