import "./globals.css";
import "./(componentes)/botones/boton.css";
import Image from "next/image";
import { Suspense } from "react";
import IconoCarrito from "./(componentes)/carrito/iconoCarrito";
import PerfilEncabezado from "./(componentes)/encabezado/perfilEncabezado";
import MarcaDesplazamiento from "./(componentes)/navegacion/marcaDesplazamiento";

export default function LayoutGlobal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="contenedorGlobal">
          <Suspense fallback={null}>
            <MarcaDesplazamiento />
          </Suspense>

          <header className="encabezadoGlobal">
            <Image
              src="/logoPictureShop.svg"
              alt="PictureShop"
              width={150}
              height={50}
              className="logotipoGlobal"
            />
            <div className="accionesEncabezado">
              <Suspense fallback={null}>
                <IconoCarrito />
              </Suspense>
              <Suspense fallback={null}>
                <PerfilEncabezado />
              </Suspense>
            </div>
          </header>

          <main className="contenedorPrincipal">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}
