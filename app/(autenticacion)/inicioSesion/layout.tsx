import type { ReactNode } from "react";
import "./style.css";
import Image from "next/image";

export default function LayoutInicioSesion({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="paginaInicioSesion">

      <div className="contenedorPaginaInicioSesion">



        {/* CONTENIDO PRINCIPAL */}

        <div className="contenidoInicioSesion">

          {/* PRESENTACION */}

          <section className="presentacionInicioSesion">
            
            <Image
              src="/fotografias.png"
              alt="Fotografias PictureShop"
              width={280}
              height={280}
              className="imagenInicioSesion"
            />

            <h1>Capturando emociones</h1>
            <h2>Bienvenido a PictureShop</h2>

          </section>

          {/* FORMULARIO */}

          <section className="seccionFormularioInicioSesio">
            {children}
          </section>

        </div>

      </div>

    </main>
  );
}