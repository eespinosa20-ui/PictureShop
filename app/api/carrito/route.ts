import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { obtenerResumenCarritoActual } from "@/servidor/carrito/carritoCliente";

export async function GET() {
  const sesion = await obtenerSesion();

  if (!sesion) {
    return Response.json(
      { mensaje: "Debes iniciar sesion" },
      { status: 401 }
    );
  }

  if (sesion.tipoUsuario !== "cliente") {
    return Response.json(
      { mensaje: "No tienes permiso para consultar el carrito" },
      { status: 403 }
    );
  }

  try {
    const carrito = await obtenerResumenCarritoActual(sesion.idUsuario);

    return Response.json({ carrito }, { status: 200 });
  } catch (error) {
    console.error("Error al consultar el resumen del carrito:", error);
    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
