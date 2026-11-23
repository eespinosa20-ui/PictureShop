"use client";

import { useEffect, useState, useMemo, type CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import Boton from "@/app/(componentes)/botones/boton";
import NavegacionCarpetas from "@/app/(componentes)/navegacion/navegacionCarpetas";
import { formatearPrecio } from "@/app/(componentes)/utilidades/precio";
import ModalGestionFotos, { type GestionFotos } from "./gestionFotos";

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

async function consultarFotos(ruta: string): Promise<{ evento: InfoEvento; fotos: Foto[] }> {
  const respuesta = await fetch(ruta, { cache: "no-store" });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.mensaje || "Error al cargar el contenido del evento");
  return { evento: datos.evento, fotos: datos.fotos ?? [] };
}

export default function PaginaContenidoEvento() {
  const parametros = useParams();
  const router = useRouter();
  const idEvento = parametros.idEvento as string;
  const rutaFotos = `/api/eventosFotografo/${idEvento}/fotos`;

  const [evento, setEvento] = useState<InfoEvento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [gestion, setGestion] = useState<GestionFotos | null>(null);
  const [aviso, setAviso] = useState("");
  const [menu, setMenu] = useState<{ idFoto: number; posicion: CSSProperties } | null>(null);

  useEffect(() => {
    let activa = true;
    async function cargarFotosEvento() {
      setCargando(true);
      setError("");
      try {
        const datos = await consultarFotos(rutaFotos);
        if (activa) {
          setEvento(datos.evento);
          setFotos(datos.fotos);
        }
      } catch (err) {
        if (activa) setError(err instanceof Error ? err.message : "No se pudo conectar con el servidor");
      } finally {
        if (activa) setCargando(false);
      }
    }

    void cargarFotosEvento();
    return () => { activa = false; };
  }, [rutaFotos]);

  useEffect(() => {
    if (!menu) return;
    const cerrar = () => setMenu(null);
    window.addEventListener("resize", cerrar);
    window.addEventListener("scroll", cerrar);
    return () => {
      window.removeEventListener("resize", cerrar);
      window.removeEventListener("scroll", cerrar);
    };
  }, [menu]);

  function alternarMenu(idFoto: number, boton: HTMLButtonElement) {
    const { top, right, bottom } = boton.getBoundingClientRect();
    const arriba = window.innerHeight - bottom < 64 && top > 64;
    setMenu((actual) => actual?.idFoto === idFoto ? null : {
      idFoto,
      posicion: {
        right: Math.max(8, Math.min(window.innerWidth - right, window.innerWidth - 210)),
        top: arriba ? "auto" : bottom + 6,
        bottom: arriba ? window.innerHeight - top + 6 : "auto",
      },
    });
  }

  async function actualizarLista(cantidad: number) {
    const mensaje = cantidad === 1 ? "Fotografía agregada correctamente."
      : cantidad > 1 ? `${cantidad} fotografías agregadas correctamente.` : "";
    try {
      setFotos((await consultarFotos(rutaFotos)).fotos);
      setAviso(mensaje);
    } catch {
      setAviso(`${mensaje} No se pudo actualizar la tabla. Recarga la página.`.trim());
    }
  }

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
    <div className="contenedorInteriorEvento paginaConDesplazamiento">
      <NavegacionCarpetas
        elementos={[
          {
            texto: "Tus eventos",
            ruta: "/eventosFotografo",
            titulo: "Volver a la lista de eventos",
          },
          { texto: evento?.nombreEvento ?? `Evento #${idEvento}`, icono: "carpeta" },
        ]}
      />

      {/* Buscador de fotos */}
      <div className="barraAccionesEventos barraFotosEvento">
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
        <div className="contenedorBotonAgregar">
          <button type="button" className="botonAgregarEvento" disabled={!evento || cargando || Boolean(error)}
            onClick={() => { setAviso(""); setGestion({ tipo: "agregar" }); }}>
            Agregar fotos
          </button>
        </div>
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
            (${formatearPrecio(evento.costoFoto)} por foto)
          </span>
        )}
      </header>

      {aviso && <p className="modalMensajeExito" role="status">{aviso}</p>}

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

          <div className="areaDesplazableArchivos" role="region" aria-label="Archivos del evento" tabIndex={0}
            onScroll={() => setMenu(null)}>
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
                        aria-haspopup="menu"
                        aria-expanded={menu?.idFoto === foto.idFoto}
                        onClick={(evento) => alternarMenu(foto.idFoto, evento.currentTarget)}
                        title="Opciones"
                      >
                        ⋮
                      </button>
                      {menu?.idFoto === foto.idFoto && (
                        <>
                          <button type="button" className="capaCierreMenu" aria-label="Cerrar opciones de la fotografía"
                            onClick={() => setMenu(null)} />
                          <div className="menuOpcionesEvento" role="menu" style={menu.posicion}>
                            <button type="button" role="menuitem" className="opcionMenuEvento opcionMenuEventoPeligro"
                              onClick={() => {
                                setMenu(null);
                                setAviso("");
                                setGestion({ tipo: "eliminar", idFoto: foto.idFoto, nombreFoto: foto.nombreFoto });
                              }}>
                              Eliminar fotografía
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
      {gestion && (
        <ModalGestionFotos
          gestion={gestion}
          rutaFotos={rutaFotos}
          cerrar={() => setGestion(null)}
          actualizarLista={actualizarLista}
          retirarFoto={(idFoto) => {
            setFotos((actuales) => actuales.filter((foto) => foto.idFoto !== idFoto));
            setAviso("Fotografía eliminada correctamente");
          }}
        />
      )}
    </div>
  );
}
