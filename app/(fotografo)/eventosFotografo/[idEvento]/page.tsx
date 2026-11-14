"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Boton from "@/app/(componentes)/botones/boton";

interface InfoEvento {
  idEvento: number;
  idFotografo: number;
  nombreEvento: string;
  costoFoto: number | string;
  fechaCreacion: string;
}

interface Foto {
  idFoto: number;
  idEvento: number;
  nombreFoto: string;
  fechaPublicacion: string;
}

export default function PaginaContenidoEvento() {
  const parametros = useParams();
  const router = useRouter();
  const idEvento = parametros.idEvento as string;

  const [evento, setEvento] = useState<InfoEvento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    async function cargarFotosEvento() {
      if (!idEvento) return;

      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(
          `/api/eventosFotografo/${idEvento}/fotos`,
          { method: "GET" }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          setError(
            resultado.mensaje || "Error al cargar el contenido del evento"
          );
          return;
        }

        setEvento(resultado.evento);
        setFotos(resultado.fotos || []);
      } catch (err) {
        console.error("Error al cargar fotos del evento:", err);
        setError("No se pudo conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    cargarFotosEvento();
  }, [idEvento]);

  // Filtrado de fotos por nombre en tiempo real
  const fotosFiltradas = useMemo(() => {
    if (!busqueda.trim()) return fotos;
    const termino = busqueda.toLowerCase().trim();
    return fotos.filter((f) =>
      f.nombreFoto.toLowerCase().includes(termino)
    );
  }, [fotos, busqueda]);

  function formatearFecha(fechaIso: string) {
    try {
      const fecha = new Date(fechaIso);
      if (isNaN(fecha.getTime())) return "—";
      const dia = String(fecha.getDate()).padStart(2, "0");
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const anio = fecha.getFullYear();
      return `${dia}/${mes}/${anio}`;
    } catch {
      return "—";
    }
  }

  return (
    <div className="contenedorInteriorEvento">
      {/* Barra de navegación superior / Breadcrumbs */}
      <nav className="barraNavegacionDrive" aria-label="Ruta de navegación">
        <div className="migasNavegacion">
          <Link
            href="/eventosFotografo"
            className="migaEnlace"
            title="Volver a la lista de eventos"
          >
            ← Volver a Eventos
          </Link>
          <span className="migaSeparador" aria-hidden="true">
            /
          </span>
          <span className="migaActual">
            {evento ? evento.nombreEvento : `Evento #${idEvento}`}
          </span>
        </div>
      </nav>

      {/* Buscador de fotos */}
      <div className="contenedorBuscador">
        <input
          type="text"
          placeholder="Buscar foto por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="inputBuscador"
          aria-label="Buscar foto por nombre"
        />
        <span className="iconoBuscador" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
      </div>

      {/* Título de la carpeta actual */}
      <header className="encabezadoCarpetaDrive">
        <div className="iconoCarpetaDrive" aria-hidden="true">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
        </div>
        <h1 className="tituloCarpetaDrive">
          {evento ? evento.nombreEvento : "Cargando evento..."}
        </h1>
        {evento && (
          <span className="subtituloCostoEvento">
            (${Number(evento.costoFoto).toFixed(2)} por foto)
          </span>
        )}
      </header>

      {/* Estado de carga */}
      {cargando && (
        <div className="estadoVacioDrive">
          <p>Cargando fotos del evento...</p>
        </div>
      )}

      {/* Estado de error */}
      {error && !cargando && (
        <div className="estadoVacioDrive">
          <p className="mensajeErrorDrive">{error}</p>
          <Boton
            texto="Volver a mis eventos"
            ancho={200}
            alto={42}
            onClick={() => router.push("/eventosFotografo")}
          />
        </div>
      )}

      {/* Lista de fotos estilo Google Drive */}
      {!cargando && !error && (
        <div className="tablaDriveContenedor">
          {/* Cabecera de la tabla */}
          <div className="cabeceraTablaDrive">
            <div className="columnaNombre">
              <span>Nombre</span>
              <span className="iconoOrdenDrive" aria-hidden="true">
                ↑
              </span>
            </div>
            <div className="columnaFecha">Fecha de publicación</div>
            <div className="columnaAcciones"></div>
          </div>

          {/* Estado vacío si no hay fotos */}
          {fotos.length === 0 ? (
            <div className="estadoVacioDrive">
              <div className="iconoCarpetaVaciaDrive" aria-hidden="true">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="textoSinFotos">Aún no hay fotos en este evento</p>
            </div>
          ) : fotosFiltradas.length === 0 ? (
            <div className="estadoVacioDrive">
              <p>No se encontraron fotos con el nombre &quot;{busqueda}&quot;.</p>
            </div>
          ) : (
            <div className="cuerpoTablaDrive">
              {fotosFiltradas.map((foto) => (
                <div key={foto.idFoto} className="filaFotoDrive">
                  {/* Columna Nombre con icono de foto */}
                  <div className="columnaNombre celdaNombreDrive">
                    <span
                      className="iconoArchivoFoto"
                      aria-label="Archivo de imagen"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="#000000"
                      >
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                      </svg>
                    </span>
                    <span className="nombreFotoTexto" title={foto.nombreFoto}>
                      {foto.nombreFoto}
                    </span>
                  </div>

                  {/* Columna Fecha */}
                  <div className="columnaFecha celdaFechaDrive">
                    {formatearFecha(foto.fechaPublicacion)}
                  </div>

                  {/* Columna Opciones (tres puntos inspirados en Drive) */}
                  <div className="columnaAcciones celdaAccionesDrive">
                    <button
                      type="button"
                      className="botonTresPuntosDrive"
                      aria-label={`Opciones de ${foto.nombreFoto}`}
                      title="Opciones"
                    >
                      ⋮
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
