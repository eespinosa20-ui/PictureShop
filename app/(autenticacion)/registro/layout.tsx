import type { ReactNode } from "react";
import "../style.css";
import Image from "next/image";




export default function LayoutRegistro({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="layout">

      <div className="contenedorPagina">


        {/* CONTENIDO PRINCIPAL */}

        <div className="contenido">

          {/* PRESENTACION */}

          <section className="presentacion">
            
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

          {/* FORMULARIO */}

          <section className="seccionFormulario">
            {children}
          </section>

        </div>

      </div>

    </main>
  );
}