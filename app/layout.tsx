import "./globals.css";
import Image from "next/image";

export default function LayoutGlobal({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="contenedorGlobal">

          <header className="encabezadoGlobal">
            <Image
              src="/logoPictureShop.svg"
              alt="PictureShop"
              width={150}
              height={50}
              className="logotipoGlobal"
            />
          </header>

          <main className="contenedorPrincipal">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}