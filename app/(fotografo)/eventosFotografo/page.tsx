"use client";

import { useEffect, useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import Boton from "@/app/(componentes)/botones/boton";

interface Evento {
  idEvento: number;
  idFotografo: number;
  nombreEvento: string;
  costoFoto: number | string;
  claveEntrar: string;
  claveVerificacionPago: string;
  fechaCreacion: string;
}

export default function PaginaEventosFotografo() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Estado del modal de creación
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [nombreEvento, setNombreEvento] = useState("");
  const [costoFoto, setCostoFoto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorCreacion, setErrorCreacion] = useState("");
  const [eventoRecienCreado, setEventoRecienCreado] = useState<{
    idEvento: number;
    claveEntrar: string;
    claveVerificacionPago: string;
  } | null>(null);

  // Estado del modal de consulta de claves
  const [modalClavesEvento, setModalClavesEvento] = useState<Evento | null>(null);
  const [mensajeCopiado, setMensajeCopiado] = useState("");

  // Cargar eventos del fotógrafo autenticado
  async function cargarEventos() {
    try {
      setErrorCarga("");
      const respuesta = await fetch("/api/eventos", { method: "GET" });
      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setErrorCarga(resultado.mensaje || "Error al cargar los eventos");
        return;
      }

      setEventos(resultado.eventos || []);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
      setErrorCarga("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarEventos();
  }, []);

  // Filtrado en tiempo real según el buscador
  const eventosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return eventos;
    const termino = busqueda.toLowerCase().trim();
    return eventos.filter((e) =>
      e.nombreEvento.toLowerCase().includes(termino)
    );
  }, [eventos, busqueda]);

  // Manejador para crear evento
  async function manejarCrearEvento(eventoSubmit: FormEvent<HTMLFormElement>) {
    eventoSubmit.preventDefault();
    setErrorCreacion("");

    if (!nombreEvento.trim()) {
      setErrorCreacion("Por favor ingresa el nombre del evento.");
      return;
    }

    const costoNumerico = Number(costoFoto);
    if (!Number.isFinite(costoNumerico) || costoNumerico < 0) {
      setErrorCreacion("El costo por foto debe ser un número válido mayor o igual a 0.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreEvento: nombreEvento.trim(),
          costoFoto: costoNumerico,
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setErrorCreacion(resultado.mensaje || "Error al crear el evento");
        setGuardando(false);
        return;
      }

      // Éxito: guardar datos creados para mostrar claves y refrescar lista
      setEventoRecienCreado({
        idEvento: resultado.idEvento,
        claveEntrar: resultado.claveEntrar,
        claveVerificacionPago: resultado.claveVerificacionPago,
      });

      // Recargar listado
      await cargarEventos();
      setNombreEvento("");
      setCostoFoto("");
    } catch (error) {
      console.error("Error al crear evento:", error);
      setErrorCreacion("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  }

  function cerrarModalCrear() {
    setModalCrearAbierto(false);
    setErrorCreacion("");
    setEventoRecienCreado(null);
    setNombreEvento("");
    setCostoFoto("");
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

  async function copiarAlPortapapeles(texto: string, etiqueta: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setMensajeCopiado(`¡${etiqueta} copiada!`);
      setTimeout(() => setMensajeCopiado(""), 2000);
    } catch {
      setMensajeCopiado("No se pudo copiar automáticamente");
    }
  }

  return (
    <div className="contenedorEventosFotografo">
      {/* Buscador de eventos (Figma) */}
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

      {/* Título de la sección */}
      <h2 className="tituloSeccionEventos">Recientemente agregado</h2>

      {/* Estado de carga o error */}
      {cargando && (
        <div className="estadoVacio">
          <p>Cargando eventos...</p>
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

      {/* Lista de eventos del fotógrafo */}
      {!cargando && !errorCarga && (
        <>
          {eventosFiltrados.length === 0 ? (
            <div className="estadoVacio">
              <p>
                {busqueda
                  ? "No se encontraron eventos con ese nombre."
                  : "Aún no has creado ningún evento."}
              </p>
              {!busqueda && (
                <Boton
                  texto="Crear primer evento"
                  ancho={200}
                  alto={44}
                  onClick={() => setModalCrearAbierto(true)}
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

                    {/* Datos del evento */}
                    <div className="detallesEvento">
                      <p>
                        Fecha de publicacion: {formatearFecha(evento.fechaCreacion)}
                      </p>
                      <p className="nombreAlbum">
                        Album: {evento.nombreEvento}
                      </p>
                      <p className="costoAlbum">
                        Costo: ${Number(evento.costoFoto).toFixed(2)} por foto
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="accionesTarjetaEvento">
                    <button
                      type="button"
                      className="botonPill"
                      onClick={() => {
                        setMensajeCopiado("");
                        setModalClavesEvento(evento);
                      }}
                      title="Ver clave de acceso y verificación"
                    >
                      Clave
                    </button>

                    <Link
                      href={`/eventosFotografo/${evento.idEvento}`}
                      className="botonPill"
                      title="Ver contenido del evento"
                    >
                      Ver
                    </Link>
                    <button
                      type="button"
                      className="botonPill"
                      aria-label="Opciones del evento"
                    >
                        ···
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Botón flotante "+ Agregar evento" (Figma) */}
      <div className="contenedorBotonAgregar">
        <button
          type="button"
          className="botonAgregarEvento"
          onClick={() => {
            setErrorCreacion("");
            setEventoRecienCreado(null);
            setModalCrearAbierto(true);
          }}
          title="Agregar nuevo evento"
        >
          <span className="iconoMas">+</span>
          <span className="textoBotonAgregar">
            <span>Agregar</span>
            <span>evento</span>
          </span>
        </button>
      </div>

      {/* MODAL 1: CREAR EVENTO (Figma Component 1) */}
      {modalCrearAbierto && (
        <div className="modalFondo" onClick={cerrarModalCrear}>
          <div
            className="modalCaja"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalCrear"
          >
            <h3 id="tituloModalCrear" className="modalTitulo">
              Evento
            </h3>

            {eventoRecienCreado ? (
              // Vista de claves recién creadas
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                <p className="modalMensajeExito">¡Evento creado exitosamente!</p>

                <div className="infoClavesCaja">
                  <div className="filaClave">
                    <span className="etiquetaClave">ID del Evento (para clientes):</span>
                    <div className="valorClaveContenedor">
                      <span className="valorClave">{eventoRecienCreado.idEvento}</span>
                      <button
                        type="button"
                        className="botonCopiar"
                        onClick={() =>
                          copiarAlPortapapeles(
                            String(eventoRecienCreado.idEvento),
                            "ID de evento"
                          )
                        }
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="filaClave">
                    <span className="etiquetaClave">Clave de entrar:</span>
                    <div className="valorClaveContenedor">
                      <span className="valorClave">{eventoRecienCreado.claveEntrar}</span>
                      <button
                        type="button"
                        className="botonCopiar"
                        onClick={() =>
                          copiarAlPortapapeles(
                            eventoRecienCreado.claveEntrar,
                            "Clave de entrar"
                          )
                        }
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="filaClave">
                    <span className="etiquetaClave">Clave de verificación de pago:</span>
                    <div className="valorClaveContenedor">
                      <span className="valorClave">
                        {eventoRecienCreado.claveVerificacionPago}
                      </span>
                      <button
                        type="button"
                        className="botonCopiar"
                        onClick={() =>
                          copiarAlPortapapeles(
                            eventoRecienCreado.claveVerificacionPago,
                            "Clave de pago"
                          )
                        }
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>

                {mensajeCopiado && (
                  <p className="modalMensajeExito">{mensajeCopiado}</p>
                )}

                <div className="modalBotones">
                  <Boton
                    texto="Aceptar"
                    ancho={160}
                    alto={44}
                    onClick={cerrarModalCrear}
                  />
                </div>
              </div>
            ) : (
              // Formulario estándar (Figma)
              <form className="modalFormulario" onSubmit={manejarCrearEvento}>
                <div className="modalCampo">
                  <input
                    type="text"
                    placeholder="Ingresar nombre"
                    value={nombreEvento}
                    onChange={(e) => setNombreEvento(e.target.value)}
                    className="modalInput"
                    required
                    autoFocus
                  />
                </div>

                <div className="modalCampo">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Costo por foto"
                    value={costoFoto}
                    onChange={(e) => setCostoFoto(e.target.value)}
                    className="modalInput"
                    required
                  />
                </div>

                {errorCreacion && (
                  <p className="modalMensajeError">{errorCreacion}</p>
                )}

                <div className="modalBotones">
                  <button
                    type="button"
                    className="botonPill"
                    onClick={cerrarModalCrear}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>

                  <Boton
                    texto={guardando ? "Creando..." : "Crear evento"}
                    ancho={150}
                    alto={42}
                    type="submit"
                    disabled={guardando}
                  />
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CONSULTAR CLAVES DE EVENTO */}
      {modalClavesEvento && (
        <div className="modalFondo" onClick={() => setModalClavesEvento(null)}>
          <div
            className="modalCaja"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalClaves"
          >
            <h3 id="tituloModalClaves" className="modalTitulo">
              {modalClavesEvento.nombreEvento}
            </h3>

            <div className="infoClavesCaja">
              <div className="filaClave">
                <span className="etiquetaClave">Clave para que el cliente entre:</span>
                <div className="valorClaveContenedor">
                  <span className="valorClave">{modalClavesEvento.claveEntrar}</span>
                  <button
                    type="button"
                    className="botonCopiar"
                    onClick={() =>
                      copiarAlPortapapeles(
                        modalClavesEvento.claveEntrar,
                        "Clave de entrar"
                      )
                    }
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="filaClave">
                <span className="etiquetaClave">Clave de verificación de pago:</span>
                <div className="valorClaveContenedor">
                  <span className="valorClave">
                    {modalClavesEvento.claveVerificacionPago}
                  </span>
                  <button
                    type="button"
                    className="botonCopiar"
                    onClick={() =>
                      copiarAlPortapapeles(
                        modalClavesEvento.claveVerificacionPago,
                        "Clave de pago"
                      )
                    }
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>

            {mensajeCopiado && (
              <p className="modalMensajeExito" style={{ marginBottom: "10px" }}>
                {mensajeCopiado}
              </p>
            )}

            <div className="modalBotones">
              <Boton
                texto="Cerrar"
                ancho={140}
                alto={42}
                onClick={() => setModalClavesEvento(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
