import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { TipoUsuario } from "@/app/(autenticacion)/datosRecuperacion";
import conexion from "../baseDatos/conexion";
import { enviarCorreoRecuperacion } from "../correo/recuperacionContrasena";
import { generarHashContrasena } from "./hashContrasena";

const cuentas = {
  cliente: { tabla: "usuariocliente", id: "idCliente" },
  fotografo: { tabla: "usuariofotografo", id: "idFotografo" },
} as const;

interface Cuenta extends RowDataPacket {
  id: number;
  correo: string;
}

interface Token extends RowDataPacket {
  id: number;
}

function hash(valor: string) {
  return createHash("sha256").update(valor).digest();
}

async function enTransaccion<T>(operacion: (db: PoolConnection) => Promise<T>) {
  const db = await conexion.getConnection();
  try {
    await db.beginTransaction();
    const resultado = await operacion(db);
    await db.commit();
    return resultado;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}

export async function reservarIntento(clave: string, maximo: number) {
  return enTransaccion(async (db) => {
    await db.execute(
      `INSERT INTO limiteRecuperacionContrasena (clave, venceEn, intentos)
       VALUES (?, UTC_TIMESTAMP(6) + INTERVAL 15 MINUTE, 0)
       ON DUPLICATE KEY UPDATE clave = clave`,
      [clave]
    );

    const [resultado] = await db.execute<ResultSetHeader>(
      `UPDATE limiteRecuperacionContrasena
       SET intentos = IF(venceEn <= UTC_TIMESTAMP(6), 1, intentos + 1),
           venceEn = IF(venceEn <= UTC_TIMESTAMP(6),
                        UTC_TIMESTAMP(6) + INTERVAL 15 MINUTE, venceEn)
       WHERE clave = ? AND (venceEn <= UTC_TIMESTAMP(6) OR intentos < ?)`,
      [clave, maximo]
    );
    return resultado.affectedRows === 1;
  });
}

export function claveOrigen(flujo: "solicitud" | "cambio", origen: string) {
  return `${flujo}:${hash(origen).toString("hex")}`;
}

function crearEnlace(tipo: TipoUsuario, token: string) {
  const url = process.env.URL_BASE_PICTURESHOP?.trim();
  if (!url) {
    throw new Error("Falta URL_BASE_PICTURESHOP", { cause: "URL_BASE_AUSENTE" });
  }
  let base: URL;
  try {
    base = new URL(url);
  } catch {
    throw new Error("URL_BASE_PICTURESHOP debe ser una URL absoluta", { cause: "URL_BASE_INVALIDA" });
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if (base.username || base.password ||
      (base.protocol !== "https:" && !(base.protocol === "http:" && local))) {
    throw new Error("URL_BASE_PICTURESHOP requiere HTTPS o HTTP local, sin credenciales", {
      cause: "URL_BASE_NO_PERMITIDA",
    });
  }

  const enlace = new URL("/restablecerContrasena", base.origin);
  enlace.searchParams.set("tipo", tipo);
  enlace.hash = new URLSearchParams({ token }).toString();
  return enlace.toString();
}

export async function enviarEnlaceRecuperacion(tipo: TipoUsuario, correo: string) {
  let etapa = "consulta de cuenta";
  try {
    await prepararYEnviarEnlace(tipo, correo, (siguiente) => { etapa = siguiente; });
  } catch (error) {
    registrarErrorRecuperacion(etapa, error);
  }
}

async function prepararYEnviarEnlace(
  tipo: TipoUsuario,
  correo: string,
  marcarEtapa: (etapa: string) => void,
) {
  const { tabla, id } = cuentas[tipo];
  const [filas] = await conexion.execute<Cuenta[]>(
    `SELECT ${id} AS id, correo FROM ${tabla} WHERE correo = ? LIMIT 2`,
    [correo]
  );
  // Una dirección duplicada dentro del mismo rol no identifica una cuenta.
  if (filas.length !== 1) return;

  marcarEtapa("generación del enlace");
  const token = randomBytes(32).toString("hex");
  const hashToken = hash(token);
  const enlace = crearEnlace(tipo, token);

  marcarEtapa("almacenamiento del token");
  const cuenta = await enTransaccion(async (db) => {
    const [vigentes] = await db.execute<Cuenta[]>(
      `SELECT ${id} AS id, correo FROM ${tabla}
       WHERE ${id} = ? AND correo = ? FOR UPDATE`,
      [filas[0].id, correo]
    );
    if (!vigentes.length) return null;

    const cuenta = vigentes[0];
    await db.execute(`DELETE FROM recuperacionContrasena WHERE ${id} = ?`, [cuenta.id]);
    await db.execute(
      `INSERT INTO recuperacionContrasena (${id}, hashToken, expiraEn)
       VALUES (?, ?, UTC_TIMESTAMP(6) + INTERVAL 15 MINUTE)`,
      [cuenta.id, hashToken]
    );
    return cuenta;
  });
  if (!cuenta) return;

  marcarEtapa("envío SMTP");
  try {
    await enviarCorreoRecuperacion(cuenta.correo, enlace);
  } catch (error) {
    try {
      await conexion.execute("DELETE FROM recuperacionContrasena WHERE hashToken = ?", [hashToken]);
    } catch (errorLimpieza) {
      registrarErrorRecuperacion("limpieza del token", errorLimpieza);
    }
    throw error;
  }
}

const mensajesDiagnostico: Record<string, string> = {
  URL_BASE_AUSENTE: "Falta configurar URL_BASE_PICTURESHOP.",
  URL_BASE_INVALIDA: "URL_BASE_PICTURESHOP debe ser una URL absoluta.",
  URL_BASE_NO_PERMITIDA: "URL_BASE_PICTURESHOP requiere HTTPS o HTTP local, sin credenciales.",
  SMTP_NO_CONFIGURADO: "Faltan variables SMTP o su formato es incorrecto.",
  EAUTH: "El servidor SMTP rechazó la autenticación.",
  EENVELOPE: "El servidor SMTP rechazó el remitente o destinatario.",
  EMESSAGE: "El servidor SMTP rechazó el mensaje.",
  ETLS: "Falló la negociación TLS con SMTP.",
  ETIMEDOUT: "Se agotó el tiempo de espera de la conexión.",
  ECONNECTION: "No se pudo establecer la conexión SMTP.",
  ECONNREFUSED: "El servidor rechazó la conexión.",
  ESOCKET: "Falló la conexión de red.",
  EDNS: "No se pudo resolver el servidor SMTP.",
  ER_NO_SUCH_TABLE: "La tabla requerida no existe en MySQL.",
  ER_BAD_FIELD_ERROR: "Una columna requerida no existe en MySQL.",
  ER_LOCK_DEADLOCK: "MySQL detectó un interbloqueo.",
  ER_LOCK_WAIT_TIMEOUT: "Se agotó el tiempo de espera de un bloqueo MySQL.",
};

export function registrarErrorRecuperacion(etapa: string, error: unknown) {
  const detalle = error as { code?: unknown; cause?: unknown; responseCode?: unknown } | null;
  const valor = detalle?.code ?? detalle?.cause;
  const codigo = typeof valor === "string" && Object.hasOwn(mensajesDiagnostico, valor)
    ? valor : "DESCONOCIDO";
  const estado = detalle?.responseCode;
  console.error("Error de recuperación de contraseña.", {
    etapa,
    tipo: error instanceof TypeError ? "TypeError" : "Error",
    codigo,
    mensaje: mensajesDiagnostico[codigo] ?? "La operación no se pudo completar.",
    estadoSMTP: typeof estado === "number" && Number.isInteger(estado) && estado >= 400 && estado <= 599
      ? estado : undefined,
  });
}

export async function restablecerContrasena(tipo: TipoUsuario, token: string, contrasena: string) {
  const { tabla, id } = cuentas[tipo];
  const hashToken = hash(token);
  const [filas] = await conexion.execute<Token[]>(
    `SELECT ${id} AS id FROM recuperacionContrasena
     WHERE hashToken = ? AND ${id} IS NOT NULL AND expiraEn > UTC_TIMESTAMP(6)`,
    [hashToken]
  );
  if (!filas.length) return false;

  const idUsuario = filas[0].id;
  const contrasenaHash = await generarHashContrasena(contrasena);
  return enTransaccion(async (db) => {
    // Mantener el mismo orden de bloqueo que al emitir el enlace.
    const [vigentes] = await db.execute<Cuenta[]>(
      `SELECT ${id} FROM ${tabla} WHERE ${id} = ? FOR UPDATE`,
      [idUsuario]
    );
    if (!vigentes.length) return false;

    const [consumido] = await db.execute<ResultSetHeader>(
      `DELETE FROM recuperacionContrasena
       WHERE hashToken = ? AND ${id} = ? AND expiraEn > UTC_TIMESTAMP(6)`,
      [hashToken, idUsuario]
    );
    if (consumido.affectedRows !== 1) return false;

    await db.execute(`UPDATE ${tabla} SET contrasena = ? WHERE ${id} = ?`, [
      contrasenaHash, idUsuario,
    ]);
    return true;
  });
}
