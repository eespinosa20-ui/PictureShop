import type { ReactNode } from "react";
import MenuCliente from "../(componentes)/menu/menuCliente";

type Propiedades = {
  children: ReactNode;
};

export default function ContenedorCliente({
  children,
}: Propiedades) {
  return (
    <div className="layoutCliente">
      <div className="contenidoCliente">

        <MenuCliente />

        <section className="pantallaCliente">
          {children}
        </section>

      </div>
    </div>
  );
}