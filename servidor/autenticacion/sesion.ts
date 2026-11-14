
import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { error } from "console";

type TipoUsuario = "cliente" | "fotografo";

function obtenerClave() {
  const clave = process.env.CLAVE_SESION;

  if (!clave || clave.length < 32) {
    throw new Error("CLAVE_SESION no configurada");
  }

  return new TextEncoder().encode(clave);
}

export async function crearSesion(
  idUsuario: number,
  tipoUsuario: TipoUsuario
) {
  const token = await new SignJWT({ tipoUsuario })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(idUsuario))
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(obtenerClave());

  const almacenamiento = await cookies();

  almacenamiento.set("sesionPictureShop", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function obtenerSesion() {
  const almacenamiento = await cookies();
  const token = almacenamiento.get("sesionPictureShop")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      obtenerClave(),
      { algorithms: ["HS256"] }
    );

    if (
      !payload.sub ||
      (payload.tipoUsuario !== "cliente" &&
        payload.tipoUsuario !== "fotografo")
    ) {
      return null;
    }

    const idUsuario = Number(payload.sub);

    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
      return null;
    }

    return {
      idUsuario,
      tipoUsuario: payload.tipoUsuario,
    };
  } catch {
    console.error("Error al validar sesion:", error);
    return null;
  }
}
