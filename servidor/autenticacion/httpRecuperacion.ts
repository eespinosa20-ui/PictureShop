import "server-only";
import { isIP } from "node:net";

export function responderRecuperacion(mensaje: string, status = 200) {
  return Response.json({ mensaje }, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

export async function leerDatosRecuperacion(solicitud: Request): Promise<Record<string, unknown>> {
  const tipo = solicitud.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (tipo !== "application/json" || !solicitud.body) return {};

  const lector = solicitud.body.pipeThrough(new TextDecoderStream("utf-8", { fatal: true })).getReader();
  try {
    let texto = "";
    while (true) {
      const { value, done } = await lector.read();
      if (done) break;
      texto += value;
      if (texto.length > 16384) {
        await lector.cancel();
        return {};
      }
    }
    const datos: unknown = JSON.parse(texto);
    return datos && typeof datos === "object" && !Array.isArray(datos)
      ? datos as Record<string, unknown>
      : {};
  } catch {
    return {};
  } finally {
    lector.releaseLock();
  }
}

export function obtenerOrigen(solicitud: Request) {
  const encabezado = process.env.ENCABEZADO_IP_RECUPERACION?.trim();
  const ip = encabezado ? solicitud.headers.get(encabezado)?.trim() : undefined;
  return ip && isIP(ip) ? ip.toLowerCase() : "compartido";
}
