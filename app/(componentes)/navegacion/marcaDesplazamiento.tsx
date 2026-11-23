"use client";

import { usePathname } from "next/navigation";

const rutasConDesplazamiento = /^\/(?:eventos|momentos|eventosFotografo(?:\/[^/]+)?|eventosCarpeta\/[^/]+)\/?$/;

export default function MarcaDesplazamiento() {
  const ruta = usePathname();
  return rutasConDesplazamiento.test(ruta) ? <span hidden data-scroll-interno="" /> : null;
}
