import { createWriteStream } from "node:fs";
import { mkdtemp, open, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ZipFile } from "yazl";
import { obtenerOriginalesComprados } from "@/servidor/cliente/momentosCliente";
import { resolverOriginalPrivado } from "@/servidor/fotos/originalPrivado";
import { autorizarClienteMomentos, leerIdentificador, responderMomentos } from "../../autorizacion";

export async function GET(
  _solicitud: Request,
  contexto: { params: Promise<{ idPedido: string }> }
) {
  const sesion = await autorizarClienteMomentos();
  if (sesion instanceof Response) return sesion;
  const idPedido = leerIdentificador((await contexto.params).idPedido);
  if (!idPedido) return responderMomentos("Pedido inválido.", 400);

  let limpiarTemporal: (() => Promise<void>) | undefined;
  try {
    const fotos = await obtenerOriginalesComprados(sesion.idUsuario, idPedido);
    if (!fotos.length) return responderMomentos("Descarga no disponible.", 404);

    const archivos: { ruta: string; nombre: string }[] = [];
    for (const foto of fotos) {
      const original = await resolverOriginalPrivado(foto);
      if (!original) {
        return responderMomentos("Falta un original del pedido. No se generó el ZIP.", 404);
      }
      const nombreBase = Array.from(original.nombreBase.replace(/[<>:"/\\|?*]/g, "_"))
        .slice(0, 50).join("").replace(/[. ]+$/, "");
      archivos.push({
        ruta: original.ruta,
        nombre: `${foto.idFoto}_${nombreBase || "foto"}${original.extension}`,
      });
    }

    const nombreCarpeta = `Pedido_${idPedido}`;
    const nombreZip = `PictureShop_${nombreCarpeta}.zip`;
    const temporal = await mkdtemp(path.join(tmpdir(), "pictureshop-pedido-"));
    const rutaZip = path.join(temporal, nombreZip);
    limpiarTemporal = async () => {
      try {
        await unlink(rutaZip).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
        await rmdir(temporal);
      } catch {
        console.error("No se pudo limpiar el ZIP temporal de Momentos.");
      }
    };

    const zip = new ZipFile();
    const salidaZip = zip.outputStream as Readable;
    zip.on("error", (error) => salidaZip.destroy(error));
    zip.addEmptyDirectory(nombreCarpeta);
    for (const archivo of archivos) {
      zip.addFile(archivo.ruta, `${nombreCarpeta}/${archivo.nombre}`);
    }
    zip.end();
    await pipeline(salidaZip, createWriteStream(rutaZip, { flags: "wx" }));

    const descriptor = await open(rutaZip, "r");
    try {
      const { size } = await descriptor.stat();
      const flujo = descriptor.createReadStream();
      const respuesta = new Response(
        Readable.toWeb(flujo) as ReadableStream<Uint8Array>,
        {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${nombreZip}"`,
            "Content-Length": String(size),
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
      flujo.once("close", limpiarTemporal);
      limpiarTemporal = undefined;
      return respuesta;
    } catch (error) {
      await descriptor.close();
      throw error;
    }
  } catch {
    console.error("No se pudo generar el ZIP de un pedido de Momentos.");
    return responderMomentos("No se pudo generar la descarga completa del pedido.", 500);
  } finally {
    await limpiarTemporal?.();
  }
}
