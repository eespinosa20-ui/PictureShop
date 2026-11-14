import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import conexion from "../baseDatos/conexion";
import type { ResultSetHeader } from "mysql2/promise";

const EXTENSIONES_PERMITIDAS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

export interface ResultadoGuardadoFoto {
  idFoto: number;
  nombreFoto: string;
  ubicacionArchivo: string;
  ubicacionVistaPrevia: string;
}

export async function procesarYGuardarFotografia(
  idEvento: number,
  archivoBuffer: Buffer,
  nombreOriginal: string
): Promise<ResultadoGuardadoFoto> {
  // 1. Validar extensión
  const extensionOriginal = path.extname(nombreOriginal).toLowerCase();
  if (!EXTENSIONES_PERMITIDAS.has(extensionOriginal)) {
    throw new Error(
      `Formato de archivo no permitido: ${nombreOriginal}. Use JPG, PNG o WebP.`
    );
  }

  // 2. Validar que sea una imagen decodificable por sharp
  let metadata;
  try {
    metadata = await sharp(archivoBuffer).metadata();
  } catch {
    throw new Error(`El archivo ${nombreOriginal} no es una imagen válida o está dañado.`);
  }

  if (!metadata.format || !metadata.width || !metadata.height) {
    throw new Error(`Metadatos de imagen no válidos para ${nombreOriginal}`);
  }

  // 3. Crear carpetas de almacenamiento local fuera de public/
  const rutaBaseEvento = path.join(
    process.cwd(),
    "almacenamiento",
    "eventos",
    String(idEvento)
  );
  const rutaOriginales = path.join(rutaBaseEvento, "originales");
  const rutaVistasPrevias = path.join(rutaBaseEvento, "vistasPrevias");

  await fs.mkdir(rutaOriginales, { recursive: true });
  await fs.mkdir(rutaVistasPrevias, { recursive: true });

  // 4. Guardar archivo original con nombre seguro único
  const idUnico = randomUUID().replace(/-/g, "");
  const nombreArchivoOriginal = `${idUnico}${extensionOriginal}`;
  const rutaAbsolutaOriginal = path.join(rutaOriginales, nombreArchivoOriginal);

  await fs.writeFile(rutaAbsolutaOriginal, archivoBuffer);

  // 5. Generar vista previa con marcas de agua repetidas

  const anchoMaximo = 900;
  const altoMaximo = 900;

  // Reducir la resolución y corregir orientación EXIF.
  const imagenReducida = await sharp(archivoBuffer)
    .rotate()
    .resize({
      width: anchoMaximo,
      height: altoMaximo,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer({ resolveWithObject: true });

  const anchoVista = imagenReducida.info.width;
  const altoVista = imagenReducida.info.height;

  // Tamaño proporcional a la fotografía.
  const tamanoFuente = Math.max(
    18,
    Math.round(Math.min(anchoVista, altoVista) * 0.045)
  );

  // Distribución del patrón de marcas de agua.
  const espacioHorizontal = Math.max(180, tamanoFuente * 12);
  const espacioVertical = Math.max(90, tamanoFuente * 5);

  const watermarkSvg = Buffer.from(`
    <svg
      width="${anchoVista}"
      height="${altoVista}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="marcaAgua"
          width="${espacioHorizontal}"
          height="${espacioVertical}"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-30)"
        >
          <text
            x="10"
            y="${Math.round(espacioVertical / 2)}"
            fill="white"
            fill-opacity="0.40"
            stroke="black"
            stroke-opacity="0.35"
            stroke-width="1"
            paint-order="stroke"
            font-family="Arial, sans-serif"
            font-size="${tamanoFuente}"
            font-weight="bold"
            letter-spacing="1"
          >
            PICTURESHOP
          </text>
        </pattern>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill="url(#marcaAgua)"
      />
    </svg>
  `);

  const nombreArchivoVistaPrevia = `${idUnico}.webp`;

  const rutaAbsolutaVistaPrevia = path.join(
    rutaVistasPrevias,
    nombreArchivoVistaPrevia
  );

  // Incrustar las marcas directamente en los píxeles.
  await sharp(imagenReducida.data)
    .composite([
      {
        input: watermarkSvg,
        gravity: "centre",
      },
    ])
    .webp({
      quality: 45,
      effort: 5,
    })
    .toFile(rutaAbsolutaVistaPrevia);


  // 6. Registrar metadatos en MySQL
  const ubicacionArchivoRelativa = `almacenamiento/eventos/${idEvento}/originales/${nombreArchivoOriginal}`;
  const ubicacionVistaPreviaRelativa = `almacenamiento/eventos/${idEvento}/vistasPrevias/${nombreArchivoVistaPrevia}`;
  const nombreLimpio = path.basename(nombreOriginal).slice(0, 255);

  const sql = `
    INSERT INTO foto (
      idEvento,
      nombreFoto,
      ubicacionArchivo,
      ubicacionVistaPrevia,
      fechaPublicacion
    ) VALUES (?, ?, ?, ?, NOW())
  `;

  const [resultado] = await conexion.execute<ResultSetHeader>(sql, [
    idEvento,
    nombreLimpio,
    ubicacionArchivoRelativa,
    ubicacionVistaPreviaRelativa,
  ]);

  return {
    idFoto: resultado.insertId,
    nombreFoto: nombreLimpio,
    ubicacionArchivo: ubicacionArchivoRelativa,
    ubicacionVistaPrevia: ubicacionVistaPreviaRelativa,
  };
}
