import "server-only";
import nodemailer from "nodemailer";

interface ConfiguracionCorreo {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export function leerConfiguracionCorreo(): {
  configuracion: ConfiguracionCorreo | null;
  faltantes: string[];
} {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const puertoTexto = process.env.SMTP_PORT?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const password = process.env.SMTP_PASSWORD ?? "";
  const from = process.env.SMTP_FROM?.trim() || user;
  const secureTexto = process.env.SMTP_SECURE?.trim().toLowerCase() ?? "";
  const puerto = Number(puertoTexto);
  const faltantes: string[] = [];

  if (!host) faltantes.push("SMTP_HOST");
  if (!puertoTexto) {
    faltantes.push("SMTP_PORT");
  } else if (!Number.isInteger(puerto) || puerto <= 0 || puerto > 65535) {
    faltantes.push("SMTP_PORT (numero de puerto valido)");
  }
  if (!user) faltantes.push("SMTP_USER");
  if (!password) faltantes.push("SMTP_PASSWORD");
  if (!from) faltantes.push("SMTP_FROM o SMTP_USER");
  if (
    secureTexto &&
    secureTexto !== "true" &&
    secureTexto !== "false" &&
    secureTexto !== "1" &&
    secureTexto !== "0"
  ) {
    faltantes.push("SMTP_SECURE (true o false)");
  }

  if (faltantes.length > 0) {
    return { configuracion: null, faltantes };
  }

  return {
    configuracion: {
      host,
      port: puerto,
      secure: secureTexto ? secureTexto === "true" || secureTexto === "1" : puerto === 465,
      user,
      password,
      from,
    },
    faltantes: [],
  };
}

export function escaparHtml(valor: string): string {
  return valor.replace(
    /[&<>"']/g,
    (caracter) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[caracter] ?? caracter
  );
}

export function crearTransportador(configuracion: ConfiguracionCorreo) {
  return nodemailer.createTransport({
    host: configuracion.host,
    port: configuracion.port,
    secure: configuracion.secure,
    auth: {
      user: configuracion.user,
      pass: configuracion.password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}
