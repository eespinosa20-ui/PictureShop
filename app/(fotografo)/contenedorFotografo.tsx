import type { ReactNode } from "react";
import MenuFotografo from "../(componentes)/menu/menuFotografo";

type Propiedades = {
  children: ReactNode;
};

export default function ContenedorFotografo({
  children,
}: Propiedades) {
  return (
    <div className="layoutCliente layoutFotografo">
      <div className="contenidoCliente contenidoFotografo">
        <MenuFotografo />
        <section className="pantallaCliente pantallaFotografo">
          {children}
        </section>
      </div>
    </div>
  );
}
