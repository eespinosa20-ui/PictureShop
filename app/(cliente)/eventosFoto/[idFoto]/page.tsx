"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Boton from "@/app/(componentes)/botones/boton";

interface EventoCliente {
  idEvento: number;
  idFotografo: number;
  nombreEvento: string;
  costoFoto: number | string;
  fechaCreacion: string;
  nombreFotografo: string | null;
}

interface FotoCliente {
  idFoto: number;
  idEvento: number;
  nombreFoto: string;
  fechaPublicacion: string;
}

export default function PaginaDetalleFotoCliente() {
  const parametros = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const idFoto = parametros.idFoto as string;
  const idEventoParam = searchParams.get("idEvento");

  const [foto, setFoto] = useState<FotoCliente | null>(null);
  const [evento, setEvento] = useState<EventoCliente | null>(null);
  const [idFotoAnterior, setIdFotoAnterior] = useState<number | null>(null);
  const [idFotoSiguiente, setIdFotoSiguiente] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDetalleFoto() {
      if (!idFoto) return;

      try {
        setCargando(true);
        setError("");

        // Si tenemos idEvento lo pasamos en la ruta, si no, primero cargamos con el idFoto
        const idEventoConsulta = idEventoParam || "1";
        const respuesta = await fetch(
          `/api/eventosCliente/${idEventoConsulta}/fotos/${idFoto}`,
          { method: "GET" }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          setError(
            resultado.mensaje || "Error al cargar la fotografía seleccionada"
          );
          return;
        }

        setFoto(resultado.foto);
        setEvento(resultado.evento);
        setIdFotoAnterior(resultado.idFotoAnterior);
        setIdFotoSiguiente(resultado.idFotoSiguiente);
      } catch (err) {
        console.error("Error al cargar detalle de foto:", err);
        setError("No se pudo conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    cargarDetalleFoto();
  }, [idFoto, idEventoParam]);

  return (
    <div className="contenedorDetalleFoto">
      {/* Nivel 3: Barra de navegación / Breadcrumbs (Figma página 9) */}
      <nav className="barraNavegacionMigas" aria-label="Ruta de navegación">
        <div className="migasNavegacion">
          <Link
            href="/eventos"
            className="migaEnlace"
            title="Volver a Recientemente agregado"
          >
            Recientemente agregado
          </Link>
          <span className="migaSeparador" aria-hidden="true">
            &gt;
          </span>
          {evento ? (
            <Link
              href={`/eventosCarpeta/${evento.idEvento}`}
              className="migaEnlace"
              title={`Volver al evento ${evento.nombreEvento}`}
            >
              <span className="iconoMigaCarpeta" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
            </span>
            {evento ? evento.nombreEvento : "Cargando..."}
            </Link>
          ) : (
            <span>Evento</span>
          )}
          <span className="migaSeparador" aria-hidden="true">
            &gt;
          </span>
          <span className="migaActual">
            <span aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </span>
          </span>
        </div>
      </nav>

      {/* Estados de carga o error */}
      {cargando && (
        <div className="estadoVacio">
          <p>Cargando fotografía...</p>
        </div>
      )}

      {error && !cargando && (
        <div className="estadoVacio">
          <p className="modalMensajeError">{error}</p>
          <Boton
            texto="Volver a Eventos"
            ancho={180}
            alto={42}
            onClick={() => router.push("/eventos")}
          />
        </div>
      )}

      {!cargando && !error && foto && evento && (
        <>
          {/* Marco blanco estilo polaroid (Figma página 9) */}
          <div className="marcoFotoIndividual">
            <div className="contenedorImagenGrande">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/fotos/${foto.idFoto}/vistaPrevia`}
                alt={foto.nombreFoto}
                className="imagenGrandeFoto"
              />
            </div>

            <div className="pieFotoIndividual">
              <div className="datosFotoIndividual">
                <p className="nombreFotoGrande">ID: {foto.nombreFoto}</p>
                <p className="precioFotoGrande">
                  Precio: ${Number(evento.costoFoto).toFixed(2)}
                </p>
              </div>

              {/* Botón de carrito según Figma página 9 */}
              <button
                type="button"
                className="botonCarritoPill"
                style={{ padding: "8px 24px" }}
                title="Agregar al carrito"
                aria-label="Agregar al carrito"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Navegación inferior: Atrás / Siguiente (Figma página 9) */}
          <div className="barraNavegacionFotos">
            <button
              type="button"
              className="botonNavegarFlecha"
              disabled={!idFotoAnterior}
              onClick={() => {
                if (idFotoAnterior) {
                  router.push(
                    `/eventosFoto/${idFotoAnterior}?idEvento=${evento.idEvento}`
                  );
                }
              }}
              title="Fotografía anterior"
            >
              <span aria-hidden="true">←</span>
              <span>Atrás</span>
            </button>

            <button
              type="button"
              className="botonNavegarFlecha"
              disabled={!idFotoSiguiente}
              onClick={() => {
                if (idFotoSiguiente) {
                  router.push(
                    `/eventosFoto/${idFotoSiguiente}?idEvento=${evento.idEvento}`
                  );
                }
              }}
              title="Fotografía siguiente"
            >
              <span>Siguiente</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
