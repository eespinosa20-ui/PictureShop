import type { ReactNode } from "react";
import Image from "next/image";

import "../style.css";


export default function LayoutInicioSesion({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="layout">

      <div className="contenido">

        {/* Presentacion izquierda */}

        <section className="presentacion">

          <div className="imagenRegistro" aria-hidden="true" />

              <Image
              src="/fotografias.png"
              alt="Fotografias PictureShop"
              width={280}
              height={280}
              className="imagenRegistro"
            />

            <h1>Capturando emociones</h1>
            <h2>Bienvenido a PictureShop</h2>

        </section>

        {/* Formulario derecho */}

        <section className="seccionFormulario">
          {children}
        </section>

      </div>

    </div>
  );
}