const PATRON_COSTO = /^\d{1,6}(\.\d{1,2})?$/;
const COSTO_MAXIMO = 999999.99;

export type ResultadoValidacionCosto =
  | { valido: true; valor: string }
  | { valido: false; mensaje: string };

/**
 * Valida un importe sin redondearlo.
 * Acepta hasta dos decimales y rechaza cualquier precision mayor.
 */
export function validarCostoFoto(valor: unknown): ResultadoValidacionCosto {
  if (typeof valor !== "string" && typeof valor !== "number") {
    return {
      valido: false,
      mensaje: "El costo por fotografia es obligatorio",
    };
  }

  const texto = String(valor).trim();

  if (!texto) {
    return {
      valido: false,
      mensaje: "El costo por fotografia es obligatorio",
    };
  }

  if (!/^\d+(\.\d+)?$/.test(texto)) {
    return {
      valido: false,
      mensaje: "El costo por fotografia debe ser un numero mayor o igual a 0",
    };
  }

  if (!PATRON_COSTO.test(texto)) {
    if (/^\d+\.\d{3,}$/.test(texto)) {
      return {
        valido: false,
        mensaje: "El costo por fotografia admite como maximo dos decimales",
      };
    }

    return {
      valido: false,
      mensaje: "El costo por fotografia no es valido",
    };
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero) || numero > COSTO_MAXIMO) {
    return {
      valido: false,
      mensaje: "El costo por fotografia no puede superar 999999.99",
    };
  }

  return { valido: true, valor: texto };
}

/**
 * Formatea un importe procedente de MySQL (DECIMAL como string) con dos
 * decimales exactos, sin pasar por aritmetica de punto flotante.
 */
export function formatearPrecio(
  valor: string | number | null | undefined
): string {
  const texto = String(valor ?? "").trim();
  const coincidencia = /^(\d+)(?:\.(\d{1,2}))?$/.exec(texto);

  if (!coincidencia) {
    return "0.00";
  }

  const entero = coincidencia[1].replace(/^0+(?=\d)/, "");
  const decimales = (coincidencia[2] ?? "").padEnd(2, "0");

  return `${entero}.${decimales}`;
}
