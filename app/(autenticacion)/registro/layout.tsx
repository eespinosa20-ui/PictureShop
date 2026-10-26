import type { ReactNode } from "react";
import "./style.css";
import Image from "next/image";

export default function LayoutRegistro({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="paginaRegistro">

      <div className="contenedorPaginaRegistro">


        {/* CONTENIDO PRINCIPAL */}

        <div className="contenidoRegistro">

          {/* PRESENTACION */}

          <section className="presentacionRegistro">
            
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

          <section className="seccionFormularioRegistro">
            {children}
          </section>

        </div>

      </div>

    </main>
  );
}