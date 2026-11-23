import Link from "next/link";

export interface ElementoNavegacionCarpetas {
  texto: string;
  ruta?: string;
  icono?: "carpeta" | "fotografia";
  titulo?: string;
}

interface PropiedadesNavegacionCarpetas {
  elementos: readonly ElementoNavegacionCarpetas[];
}

const iconosNavegacion = {
  carpeta: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  ),
  fotografia: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
};

export default function NavegacionCarpetas({
  elementos,
}: PropiedadesNavegacionCarpetas) {
  if (!elementos.length) return null;

  return (
    <nav className="barraNavegacionMigas" aria-label="Ruta de navegación">
      <ol className="migasNavegacion" role="list">
        {elementos.map(({ texto, ruta, icono, titulo }, indice) => {
          const paginaActual = indice === elementos.length - 1 ? "page" : undefined;
          const contenido = (
            <>
              {icono && (
                <span className="iconoMigaCarpeta" aria-hidden="true">
                  {iconosNavegacion[icono]}
                </span>
              )}
              <span>{texto}</span>
            </>
          );

          return (
            <li key={indice}>
              {indice > 0 && (
                <span className="migaSeparador" aria-hidden="true">
                  &gt;
                </span>
              )}
              {ruta ? (
                <Link
                  href={ruta}
                  className="migaEnlace"
                  title={titulo}
                  aria-current={paginaActual}
                >
                  {contenido}
                </Link>
              ) : (
                <span className="migaActual" aria-current={paginaActual}>
                  {contenido}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
