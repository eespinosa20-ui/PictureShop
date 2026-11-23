import { open } from "node:fs/promises";
import { Readable } from "node:stream";
import { obtenerOriginalesComprados } from "@/servidor/cliente/momentosCliente";
import { resolverOriginalPrivado, tiposImagen } from "@/servidor/fotos/originalPrivado";
import { autorizarClienteMomentos, leerIdentificador, responderMomentos } from "../../../../autorizacion";

export async function GET(
  _solicitud: Request,
  contexto: { params: Promise<{ idPedido: string; idFoto: string }> }
) {
  try {
    const sesion = await autorizarClienteMomentos();
    if (sesion instanceof Response) return sesion;
    const parametros = await contexto.params;
    const idPedido = leerIdentificador(parametros.idPedido);
    const idFoto = leerIdentificador(parametros.idFoto);
    if (!idPedido || !idFoto) return responderMomentos("Identificador inválido.", 400);

    const [foto] = await obtenerOriginalesComprados(sesion.idUsuario, idPedido, idFoto);
    const noDisponible = () => responderMomentos("Original no disponible.", 404);
    const original = foto && await resolverOriginalPrivado(foto);
    if (!original) return noDisponible();

    const { ruta, extension, nombreBase } = original;
    const nombre = encodeURIComponent(nombreBase + extension)
      .replace(/['()*]/g, (caracter) => "%" + caracter.charCodeAt(0).toString(16));

    const descriptor = await open(ruta, "r");
    try {
      const datos = await descriptor.stat();
      if (!datos.isFile()) {
        await descriptor.close();
        return noDisponible();
      }
      const contenido = Readable.toWeb(descriptor.createReadStream()) as ReadableStream<Uint8Array>;
      return new Response(contenido, {
        headers: {
          "Content-Type": tiposImagen[extension],
          "Content-Length": String(datos.size),
          "Content-Disposition": `attachment; filename="foto-${idFoto}${extension}"; filename*=UTF-8''${nombre}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      await descriptor.close();
      throw error;
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return responderMomentos("Original no disponible.", 404);
    }
    console.error("Error al descargar un original comprado.");
    return responderMomentos("No se pudo descargar el original.", 500);
  }
}
