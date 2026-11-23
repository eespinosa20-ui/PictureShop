"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  EVENTO_CARRITO_ACTUALIZADO,
  obtenerCarritoEvento,
  obtenerResumenCarritoActual,
} from "./apiCarrito";

const RUTAS_CLIENTE = [
  "/principal",
  "/eventos",
  "/eventosCarpeta",
  "/eventosFoto",
  "/momentos",
  "/carrito",
];

interface ResumenIcono {
  idEvento: number | null;
  cantidad: number;
}

function esRutaCliente(ruta: string) {
  return RUTAS_CLIENTE.some(
    (base) => ruta === base || ruta.startsWith(`${base}/`)
  );
}

function obtenerIdEventoDeRuta(
  ruta: string,
  parametros: { get(nombre: string): string | null }
) {
  const coincidencia = ruta.match(
    /^\/(?:eventosCarpeta|carrito)\/(\d+)(?:\/|$)/
  );

  if (coincidencia?.[1]) {
    return coincidencia[1];
  }

  if (ruta.startsWith("/eventosFoto/")) {
    const idEvento = parametros.get("idEvento");
    return idEvento && /^\d+$/.test(idEvento) ? idEvento : null;
  }

  return null;
}

export default function IconoCarrito() {
  const rutaActual = usePathname();
  const parametrosBusqueda = useSearchParams();
  const [resumen, setResumen] = useState<ResumenIcono | null>(null);

  const esCliente = useMemo(() => esRutaCliente(rutaActual), [rutaActual]);

  const idEventoRuta = useMemo(
    () => obtenerIdEventoDeRuta(rutaActual, parametrosBusqueda),
    [parametrosBusqueda, rutaActual]
  );

  useEffect(() => {
    if (!esCliente) {
      return;
    }

    let activo = true;
    let ultimaConsulta = 0;

    async function cargarResumen() {
      const consulta = ++ultimaConsulta;
      let siguiente: ResumenIcono | null = null;

      if (idEventoRuta) {
        const resultado = await obtenerCarritoEvento(idEventoRuta);
        siguiente = {
          idEvento: Number(idEventoRuta),
          cantidad: resultado.exito ? resultado.datos.cantidad : 0,
        };
      } else {
        const resultado = await obtenerResumenCarritoActual();
        siguiente =
          resultado.exito && resultado.datos
            ? {
                idEvento: resultado.datos.idEvento,
                cantidad: resultado.datos.cantidad,
              }
            : null;
      }

      if (activo && consulta === ultimaConsulta) {
        setResumen(siguiente);
      }
    }

    cargarResumen();

    const actualizar = () => {
      void cargarResumen();
    };

    window.addEventListener(EVENTO_CARRITO_ACTUALIZADO, actualizar);

    return () => {
      activo = false;
      window.removeEventListener(EVENTO_CARRITO_ACTUALIZADO, actualizar);
    };
  }, [esCliente, idEventoRuta]);

  if (!esCliente) {
    return null;
  }

  const idEventoVisible = idEventoRuta
    ? Number(idEventoRuta)
    : resumen?.idEvento ?? null;

  const cantidad =
    resumen && resumen.idEvento === idEventoVisible ? resumen.cantidad : 0;

  const etiqueta =
    cantidad === 1
      ? "Carrito de compras, 1 fotografia"
      : `Carrito de compras, ${cantidad} fotografias`;

  const contenido = (
    <>
      <Image
        src="/iconos/icono_carrito_transparente.png"
        alt=""
        width={1315}
        height={1196}
        sizes="38px"
      />
      {cantidad > 0 && (
        <span className="badgeCarritoEncabezado" aria-hidden="true">
          {cantidad}
        </span>
      )}
    </>
  );

  if (!idEventoVisible) {
    return (
      <span
        className="iconoAccionEncabezado"
        title="Carrito de compras vacio"
        aria-label="Carrito de compras vacio"
      >
        {contenido}
      </span>
    );
  }

  return (
    <Link
      href={`/carrito/${idEventoVisible}`}
      className="iconoAccionEncabezado"
      title={`Carrito de compras (${cantidad})`}
      aria-label={etiqueta}
    >
      {contenido}
    </Link>
  );
}
