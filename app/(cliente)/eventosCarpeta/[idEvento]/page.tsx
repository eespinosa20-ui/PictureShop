"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Boton from "@/app/(componentes)/botones/boton";
import { formatearPrecio } from "@/app/(componentes)/utilidades/precio";

interface EventoCliente {
  idEvento: number;
  idFotografo: number;
  nombreEvento: string;
  costoFoto: number | string;
  fechaCreacion: string;
  nombreFotografo: string | null;
  fechaAcceso: string;
}

interface FotoCliente {
  idFoto: number;
  idEvento: number;
  nombreFoto: string;
  fechaPublicacion: string;
}

export default function PaginaInteriorEventoCliente() {
  const parametros = useParams();
  const router = useRouter();
  const idEvento = parametros.idEvento as string;

  const [evento, setEvento] = useState<EventoCliente | null>(null);
  const [fotos, setFotos] = useState<FotoCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarFotosEvento() {
      if (!idEvento) return;

      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          `/api/eventosCliente/${idEvento}/fotos`,
          { method: "GET" }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          setError(
            resultado.mensaje || "Error al cargar las fotografías del evento"
          );
          return;
        }

        setEvento(resultado.evento);
        setFotos(resultado.fotos || []);
      } catch (err) {
        console.error("Error al cargar fotos de evento:", err);
        setError("No se pudo conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    cargarFotosEvento();
  }, [idEvento]);

  function formatearFecha(fechaIso: string) {
    try {
      const fecha = new Date(fechaIso);
      if (isNaN(fecha.getTime())) return "xx/xx/xxxx";
      const dia = String(fecha.getDate()).padStart(2, "0");
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const anio = fecha.getFullYear();
      return `${dia}/${mes}/${anio}`;
    } catch {
      return "xx/xx/xxxx";
    }
  }

  return (
    <div className="contenedorInteriorEventoCliente">
      {/* Nivel 2: Barra de navegación / Breadcrumbs (Figma página 8) */}
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
          <span className="migaActual">
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
          </span>
        </div>
      </nav>

      {/* Estados de carga o error */}
      {cargando && (
        <div className="estadoVacio">
          <p>Cargando fotografías del evento...</p>
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

      {!cargando && !error && evento && (
        <>
          {/* Tarjeta de información del evento (Figma página 8) */}
          <div className="tarjetaInfoEventoCliente">
            <div className="tarjetaInfoContenido">
              <div className="iconoCarpetaGrande" aria-hidden="true">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
              </div>

              <div className="detallesInfoEvento">
                <p>
                  <strong>Autor:</strong> {evento.nombreFotografo || "Fotógrafo"}
                </p>
                <p>
                  <strong>Album:</strong> {evento.nombreEvento}
                </p>
                <p>
                  <strong>Fecha de publicacion:</strong>{" "}
                  {formatearFecha(evento.fechaCreacion)}
                </p>
                <p>
                  <strong>Precio por fotografía:</strong> $
                  {formatearPrecio(evento.costoFoto)}
                </p>
              </div>
            </div>

            {/* Icono de carrito en la cabecera (visual según Figma) */}
            <div
              className="botonCarritoEvento"
              title="Carrito de compras"
              aria-label="Carrito de compras"
            >
              <svg
                width="24"
                height="24"
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
            </div>
          </div>

          {/* Cuadrícula de fotos con marca de agua (Figma página 8) */}
          {fotos.length === 0 ? (
            <div className="estadoVacio">
              <p>Aún no hay fotografías cargadas en este evento.</p>
            </div>
          ) : (
            <div className="cuadriculaFotosCliente">
              {fotos.map((foto) => (
                <article
                  key={foto.idFoto}
                  className="tarjetaFotoCliente"
                  onClick={() =>
                    router.push(
                      `/eventosFoto/${foto.idFoto}?idEvento=${evento.idEvento}`
                    )
                  }
                  title={`Ver detalle de ${foto.nombreFoto}`}
                >
                  {/* Vista previa con marca de agua protegida */}
                  <div className="marcoFotoCliente">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/fotos/${foto.idFoto}/vistaPrevia`}
                      alt={foto.nombreFoto}
                      className="imagenPreviaCliente"
                      loading="lazy"
                    />
                  </div>

                  {/* Pie de la tarjeta */}
                  <div className="pieFotoCliente">
                    <div className="infoTextoFoto">
                      <span className="etiquetaIdFoto" title={foto.nombreFoto}>
                        ID: {foto.nombreFoto}
                      </span>
                      <span className="etiquetaPrecioFoto">
                        Precio: ${formatearPrecio(evento.costoFoto)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="botonCarritoPill"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Funcionalidad visual conforme a requerimientos
                      }}
                      title="Agregar al carrito"
                      aria-label="Agregar al carrito"
                    >
                      <svg
                        width="18"
                        height="18"
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
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
