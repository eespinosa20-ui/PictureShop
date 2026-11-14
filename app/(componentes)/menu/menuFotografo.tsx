"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function MenuFotografo() {
  const rutaActual = usePathname();

  const opciones = [
    {
      nombre: "Principal",
      ruta: "/principalFotografo",
      icono: "/iconos/iconoPrincipal.png",
    },
    {
      nombre: "Eventos",
      ruta: "/eventosFotografo",
      icono: "/iconos/iconoEventos.png",
    },
  ];

  return (
    <nav
      id="menuFotografo"
      aria-label="Navegación del fotógrafo"
      className="menuFotografo"
    >
      <div
        className="imagenMenu"
        aria-hidden="true"
      />
      <div className="opcionesMenu">
        {opciones.map((opcion) => {
          const seleccionado =
            rutaActual === opcion.ruta ||
            rutaActual.startsWith(`${opcion.ruta}/`);

          return (
            <Link
              key={opcion.ruta}
              href={opcion.ruta}
              className={`opcionMenu ${
                seleccionado ? "opcionSeleccionada" : ""
              }`}
              title={opcion.nombre}
            >
              <span className="iconoMenu">
                <Image
                  src={opcion.icono}
                  alt=""
                  width={38}
                  height={38}
                />
              </span>

              <span className="textoMenu">
                {opcion.nombre}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
