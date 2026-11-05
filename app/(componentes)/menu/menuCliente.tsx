"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";



export default function MenuCliente(){

  const rutaActual = usePathname();



  const opciones = [
    {
      nombre: "Principal",
      ruta: "/principal",
      icono: "/iconos/iconoPrincipal.png",
    },
    {
      nombre: "Eventos",
      ruta: "/eventos",
      icono: "/iconos/iconoEventos.png",
    },
    {
      nombre: "Momentos",
      ruta: "/momentos",
      icono: "/iconos/iconoMomentos.png",
    },
  ];

  return (
    
    <nav
      id="menuCliente"
      aria-label="Navegación del cliente"
      className="menuCliente"

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