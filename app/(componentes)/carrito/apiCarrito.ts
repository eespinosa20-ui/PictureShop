export interface FotoCarrito {
  idFoto: number;
  idEvento: number;
  nombreFoto: string;
  fechaPublicacion: string;
  costoFoto: string;
}

export interface CarritoEvento {
  idCarrito: number | null;
  idEvento: number;
  nombreEvento: string;
  nombreFotografo: string | null;
  costoFoto: string;
  fotos: FotoCarrito[];
  cantidad: number;
  total: string;
}

export interface FotoPedido {
  idFoto: number;
  nombreFoto: string;
  fechaPublicacion: string;
  precioUnitario: string;
}

export interface PedidoConfirmado {
  idPedido: number;
  idEvento: number;
  nombreEvento: string;
  nombreFotografo: string | null;
  montoTotal: string;
  estadoPedido: "pendiente" | "desbloqueado" | "cancelado";
  fechaCreacion: string;
  cantidad: number;
  fotos: FotoPedido[];
}

export interface ResumenCarritoActual {
  idEvento: number;
  cantidad: number;
}

export const EVENTO_CARRITO_ACTUALIZADO = "carritoActualizado";

export function notificarCarritoActualizado() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_CARRITO_ACTUALIZADO));
  }
}

export type ResultadoApi<T> =
  | { exito: true; datos: T }
  | { exito: false; mensaje: string; estado: number };

function obtenerMensaje(datos: unknown): string | null {
  if (
    typeof datos !== "object" ||
    datos === null ||
    !("mensaje" in datos) ||
    typeof (datos as { mensaje?: unknown }).mensaje !== "string"
  ) {
    return null;
  }

  return (datos as { mensaje: string }).mensaje;
}

async function solicitar<T>(
  url: string,
  init?: RequestInit
): Promise<ResultadoApi<T>> {
  try {
    const respuesta = await fetch(url, init);
    let datos: unknown = null;

    try {
      datos = await respuesta.json();
    } catch {
      datos = null;
    }

    if (!respuesta.ok) {
      return {
        exito: false,
        mensaje:
          obtenerMensaje(datos) || "No se pudo completar la operacion",
        estado: respuesta.status,
      };
    }

    return { exito: true, datos: datos as T };
  } catch {
    return {
      exito: false,
      mensaje: "No se pudo conectar con el servidor",
      estado: 0,
    };
  }
}

export async function obtenerCarritoEvento(
  idEvento: number | string
): Promise<ResultadoApi<CarritoEvento>> {
  const resultado = await solicitar<{ carrito: CarritoEvento }>(
    `/api/carrito/${idEvento}`,
    { method: "GET", cache: "no-store" }
  );

  if (!resultado.exito) {
    return resultado;
  }

  return { exito: true, datos: resultado.datos.carrito };
}

export async function obtenerResumenCarritoActual(): Promise<
  ResultadoApi<ResumenCarritoActual | null>
> {
  const resultado = await solicitar<{
    carrito: ResumenCarritoActual | null;
  }>("/api/carrito", { method: "GET", cache: "no-store" });

  if (!resultado.exito) {
    return resultado;
  }

  return { exito: true, datos: resultado.datos.carrito };
}

export async function agregarFotoCarrito(
  idEvento: number | string,
  idFoto: number,
  notificar = true
): Promise<
  ResultadoApi<{
    mensaje: string;
    yaExistia: boolean;
    carrito: CarritoEvento;
  }>
> {
  const resultado = await solicitar<{
    mensaje: string;
    yaExistia: boolean;
    carrito: CarritoEvento;
  }>(`/api/carrito/${idEvento}/fotos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idFoto }),
  });

  if (resultado.exito && notificar) {
    notificarCarritoActualizado();
  }

  return resultado;
}

export async function quitarFotoCarrito(
  idEvento: number | string,
  idFoto: number
): Promise<ResultadoApi<{ mensaje: string; carrito: CarritoEvento }>> {
  const resultado = await solicitar<{
    mensaje: string;
    carrito: CarritoEvento;
  }>(`/api/carrito/${idEvento}/fotos/${idFoto}`, { method: "DELETE" });

  if (resultado.exito) {
    notificarCarritoActualizado();
  }

  return resultado;
}

interface RespuestaConfirmarPedido {
  mensaje: string;
  pedido: PedidoConfirmado;
  notificacionEnviada: boolean;
}

export async function confirmarPedidoCarrito(
  idEvento: number | string
): Promise<ResultadoApi<RespuestaConfirmarPedido>> {
  const resultado = await solicitar<RespuestaConfirmarPedido>(
    `/api/carrito/${idEvento}/confirmar`,
    { method: "POST" }
  );

  if (resultado.exito) {
    notificarCarritoActualizado();
  }

  return resultado;
}
