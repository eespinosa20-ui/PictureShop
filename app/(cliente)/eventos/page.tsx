"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import Boton from "@/app/(componentes)/botones/boton";

interface EventoAutorizado {
  idEvento: number;
  idFotografo: number;
  nombreEvento: string;
  costoFoto: number | string;
  fechaCreacion: string;
  nombreFotografo: string | null;
  fechaAcceso: string;
}

export default function PaginaEventosCliente() {
  const [eventos, setEventos] = useState<EventoAutorizado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modalIdAbierto, setModalIdAbierto] = useState(false);

  // Estado del modal "+ Agregar evento"
  const [claveEntrarInput, setClaveEntrarInput] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeErrorModal, setMensajeErrorModal] = useState("");
  const [mensajeExitoModal, setMensajeExitoModal] = useState("");

  async function cargarEventos() {
    try {
      setErrorCarga("");
      const respuesta = await fetch("/api/eventosCliente", { method: "GET" });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setErrorCarga(resultado.mensaje || "Error al cargar los eventos");
        return;
      }

      setEventos(resultado.eventos || []);
    } catch (error) {
      console.error("Error al obtener eventos de cliente:", error);
      setErrorCarga("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarEventos();
  }, []);

  // Filtrado de eventos por nombre en tiempo real
  const eventosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return eventos;
    const termino = busqueda.toLowerCase().trim();
    return eventos.filter((e) =>
      e.nombreEvento.toLowerCase().includes(termino)
    );
  }, [eventos, busqueda]);

  // Manejador para agregar evento privado mediante claveEntrar
  async function manejarAgregarEvento(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensajeErrorModal("");
    setMensajeExitoModal("");

    const claveLimpia = claveEntrarInput.trim();
    if (!claveLimpia) {
      setMensajeErrorModal("Por favor ingresa la clave de acceso del evento.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/eventosCliente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claveEntrar: claveLimpia }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeErrorModal(
          resultado.mensaje || "No se pudo agregar el evento"
        );
        return;
      }

      setMensajeExitoModal(resultado.mensaje || "¡Evento agregado!");
      await cargarEventos();

    } catch (error) {
      console.error("Error al agregar evento:", error);
      setMensajeErrorModal("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  }

  
  function cerrarModal() {
    if (guardando) return;

    setModalIdAbierto(false);
    setClaveEntrarInput("");
    setMensajeErrorModal("");
    setMensajeExitoModal("");
  }


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
    <div className="contenedorEventosCliente paginaConDesplazamiento">
      {/* Buscador de eventos (Figma) */}
      <div className="barraAccionesEventos">
        <div className="contenedorBuscador">
          <input
            type="text"
            placeholder="Buscar nombre de evento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="inputBuscador"
            aria-label="Buscar nombre de evento"
          />
          <span className="iconoBuscador" aria-hidden="true">
            <svg
              width="20"
              height="20"
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
                  {/* Botón flotante "+ clave de acceso" (Figma) */}
        <div className="contenedorBotonAgregar">
          <button
            type="button"
            className="botonAgregarEvento"
            onClick={() => {
              setMensajeErrorModal("");
              setMensajeExitoModal("");
              setModalIdAbierto(true);
            }}
            title="Agregar evento privado mediante clave de acceso"
          >
            <span className="iconoMas">+</span>
            <span className="textoBotonAgregar">
              <span>Entrar</span>
              <span>a evento</span>
            </span>
          </button>
        </div>
      </div>


      {/* Título de la sección (Figma) */}
      <h2 className="tituloSeccionEventos">Tus eventos</h2>

      <div className="areaDesplazableArchivos" role="region" aria-label="Eventos del cliente" tabIndex={0}>
        {/* Estados de carga o error */}
        {cargando && (
          <div className="estadoVacio">
            <p>Cargando eventos autorizados...</p>
          </div>
        )}

        {errorCarga && (
          <div className="estadoVacio">
            <p className="modalMensajeError">{errorCarga}</p>
            <Boton
              texto="Reintentar"
              ancho={140}
              alto={40}
              onClick={() => cargarEventos()}
            />
          </div>
        )}

        {/* Listado de eventos autorizados (Nivel 1) */}
        {!cargando && !errorCarga && (
          <>
            {eventosFiltrados.length === 0 ? (
              <div className="estadoVacio">
                <p>
                  {busqueda
                    ? "No se encontraron eventos con ese nombre."
                    : "Aún no tienes eventos agregados. Ingresa la clave de acceso proporcionada por tu fotógrafo."}
                </p>
                {!busqueda && (
                  <Boton
                    texto="Entrar a evento"
                    ancho={220}
                    alto={44}
                    onClick={() => setModalIdAbierto(true)}
                  />
                )}
              </div>
            ) : (
              <div className="listaEventos">
                {eventosFiltrados.map((evento) => (
                  <article key={evento.idEvento} className="tarjetaEvento">
                    <div className="tarjetaEventoContenido">
                      {/* Icono de carpeta (Figma) */}
                      <div className="iconoCarpetaEvento" aria-hidden="true">
                        <svg
                          width="44"
                          height="44"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                      </div>

                      {/* Información del evento (Figma) */}
                      <div className="detallesEvento">
                        <p>
                          Fecha de publicacion: {formatearFecha(evento.fechaCreacion)}
                        </p>
                        <p>
                          Autor: {evento.nombreFotografo || "Fotógrafo"}
                        </p>
                        <p className="nombreAlbum">
                          Album: {evento.nombreEvento}
                        </p>
                      </div>
                    </div>

                    {/* Botón Ver para entrar al Nivel 2 */}
                    <div className="accionesTarjetaEvento">
                      <Link
                        href={`/eventosCarpeta/${evento.idEvento}`}
                        className="botonPill"
                        title={`Ver fotos de ${evento.nombreEvento}`}
                      >
                        Ver
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {modalIdAbierto && (
        <div className="modalFondo" onClick={cerrarModal}>
          <div
            className="modalCaja"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalId"
          >
            <h3 id="tituloModalId" className="modalTitulo">
              Ingresar la clave de acceso del evento
            </h3>

            <form className="modalFormulario" onSubmit={manejarAgregarEvento}>
              <div className="modalCampo">
                <input
                  type="text"
                  min="1"
                  placeholder="Clave de acceso"
                  value={claveEntrarInput}
                  onChange={(e) => setClaveEntrarInput(e.target.value)}
                  className="modalInput"
                  required
                  disabled={guardando}
                  autoFocus
                />
              </div>

              {mensajeErrorModal && (
                <p className="modalMensajeError">{mensajeErrorModal}</p>
              )}

              {mensajeExitoModal && (
                <p className="modalMensajeExito">{mensajeExitoModal}</p>
              )}

              <div className="modalBotones">
                <button
                  type="button"
                  className="botonPill"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <Boton
                  texto={guardando ? "Verificando..." : "Agregar"}
                  ancho={140}
                  alto={42}
                  type="submit"
                  disabled={guardando}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
