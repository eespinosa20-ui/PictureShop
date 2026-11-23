"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export default function VentanaUsuario({ nombre, correo }: {
  nombre: string | null;
  correo: string | null;
}) {
  const ruta = usePathname();
  const esRutaAutenticacion = /^\/(inicioSesion|registro)(\/|$)/.test(ruta);
  const [abierta, setAbierta] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierta || esRutaAutenticacion) return;
    function cerrarDesdeFuera(evento: PointerEvent) {
      if (evento.target instanceof Node && !contenedor.current?.contains(evento.target)) {
        setAbierta(false);
      }
    }
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !evento.defaultPrevented) {
        setAbierta(false);
        boton.current?.focus();
      }
    }
    document.addEventListener("pointerdown", cerrarDesdeFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarDesdeFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierta, esRutaAutenticacion]);

  if (esRutaAutenticacion) return null;

  return (
    <div className="perfilEncabezado" ref={contenedor}>
      <button
        ref={boton}
        type="button"
        className="iconoAccionEncabezado"
        aria-label="Usuario"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta((actual) => !actual)}
      >
        <Image
          src="/iconos/icono_usuario_transparente.png"
          alt=""
          width={1263}
          height={1246}
          sizes="38px"
        />
      </button>
      <div className="ventanaUsuario" id={id} hidden={!abierta}>
        <strong>Usuario</strong>
        {nombre && <p>{nombre}</p>}
        {correo && <p>{correo}</p>}
      </div>
    </div>
  );
}
