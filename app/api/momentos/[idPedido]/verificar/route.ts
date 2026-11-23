import { verificarPagoPedido } from "@/servidor/cliente/momentosCliente";
import { autorizarClienteMomentos, leerIdentificador, responderMomentos } from "../../autorizacion";

export async function POST(solicitud: Request, contexto: { params: Promise<{ idPedido: string }> }) {
  try {
    const sesion = await autorizarClienteMomentos();
    if (sesion instanceof Response) return sesion;
    const idPedido = leerIdentificador((await contexto.params).idPedido);
    if (!idPedido) return responderMomentos("Pedido inválido.", 400);

    const datos = await solicitud.json().catch(() => null);
    const clave = typeof datos?.clave === "string" ? datos.clave.trim() : "";
    if (!clave || clave.length > 120) return responderMomentos("Introduce una clave válida.", 400);

    const resultado = await verificarPagoPedido(sesion.idUsuario, idPedido, clave);
    switch (resultado) {
      case "verificado": return responderMomentos("Pago verificado.", 200);
      case "no_encontrado": return responderMomentos("Pedido no encontrado.", 404);
      case "clave_incorrecta": return responderMomentos("La clave es incorrecta.", 403);
      case "no_disponible": return responderMomentos("El pedido no se puede verificar.", 409);
    }
  } catch {
    console.error("Error al verificar el pago del pedido.");
    return responderMomentos("No se pudo verificar el pago.", 500);
  }
}
