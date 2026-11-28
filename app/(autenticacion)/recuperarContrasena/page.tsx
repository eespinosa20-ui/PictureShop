import { Suspense } from "react";
import FormularioRecuperacion from "../formularioRecuperacion";
import LayoutInicioSesion from "../inicioSesion/layout";

export const metadata = { title: "Recuperar contraseña - PictureShop", robots: { index: false } };

type Propiedades = { searchParams: Promise<{ tipo?: string | string[] }> };

async function Contenido({ searchParams }: Propiedades) {
  return <FormularioRecuperacion tipo={(await searchParams).tipo} restablecer={false} />;
}

export default function Pagina({ searchParams }: Propiedades) {
  return (
    <LayoutInicioSesion>
      <Suspense fallback={<p role="status">Cargando formulario…</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </LayoutInicioSesion>
  );
}
