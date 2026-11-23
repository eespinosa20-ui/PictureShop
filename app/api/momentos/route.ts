import { obtenerComprasMomentos } from "@/servidor/cliente/momentosCliente";
import { autorizarClienteMomentos, responderMomentos } from "./autorizacion";

export async function GET() {
  const sesion = await autorizarClienteMomentos();
  if (sesion instanceof Response) return sesion;

  try {
    const compras = await obtenerComprasMomentos(sesion.idUsuario);
    return Response.json({ compras }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error al consultar Momentos:", error);
    return responderMomentos("No se pudieron consultar tus compras.", 500);
  }
}
