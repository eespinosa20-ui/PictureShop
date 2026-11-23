"use client";

import {
  useEffect,
  useState,
  useMemo,
  useRef,
  type FormEvent,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import Link from "next/link";
import Boton from "@/app/(componentes)/botones/boton";
import {
  formatearPrecio,
  validarCostoFoto,
} from "@/app/(componentes)/utilidades/precio";

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

  const [eventoEditarPrecio, setEventoEditarPrecio] =
  useState<Evento | null>(null);


  // Estado del modal de creación
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [nombreEvento, setNombreEvento] = useState("");
  const [costoFoto, setCostoFoto] = useState("");
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([]);
  const [nombreCarpeta, setNombreCarpeta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [progresoCarga, setProgresoCarga] = useState<{
    actual: number;
    total: number;
  } | null>(null);
  const [mensajeEstado, setMensajeEstado] = useState("");
  const [errorCreacion, setErrorCreacion] = useState("");
  const [eventoRecienCreado, setEventoRecienCreado] = useState<{
    idEvento: number;
    claveEntrar: string;
    claveVerificacionPago: string;
  } | null>(null);

  const inputCarpetaRef = useRef<HTMLInputElement>(null);

  // Estado del modal de consulta de claves
  const [modalClavesEvento, setModalClavesEvento] = useState<Evento | null>(null);
  const [mensajeCopiado, setMensajeCopiado] = useState("");

  // Estado del menu contextual y de la administracion del evento
  const [menuEventoAbierto, setMenuEventoAbierto] = useState<{
    idEvento: number;
    posicion: CSSProperties;
  } | null>(null);

  useEffect(() => {
    if (!menuEventoAbierto) return;
    const cerrar = () => setMenuEventoAbierto(null);
    window.addEventListener("resize", cerrar);
    window.addEventListener("scroll", cerrar);
    return () => {
      window.removeEventListener("resize", cerrar);
      window.removeEventListener("scroll", cerrar);
    };
  }, [menuEventoAbierto]);

  function alternarMenuEvento(idEvento: number, boton: HTMLButtonElement) {
    const { top, right, bottom } = boton.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - bottom;
    const abrirArriba = espacioAbajo < 110 && top > espacioAbajo;
    setMenuEventoAbierto((anterior) => anterior?.idEvento === idEvento ? null : {
      idEvento,
      posicion: {
        right: Math.max(8, Math.min(window.innerWidth - right, window.innerWidth - 188)),
        top: abrirArriba ? "auto" : bottom + 6,
        bottom: abrirArriba ? window.innerHeight - top + 6 : "auto",
        maxHeight: Math.max(0, (abrirArriba ? top : espacioAbajo) - 14),
      },
    });
  }
  const [eventoRenombrar, setEventoRenombrar] = useState<Evento | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [errorRenombrar, setErrorRenombrar] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [eventoEliminar, setEventoEliminar] = useState<Evento | null>(null);
  const [errorEliminar, setErrorEliminar] = useState("");
  const [eliminandoEvento, setEliminandoEvento] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState("");
  
  const [nuevoPrecio, setNuevoPrecio] = useState("");

  const [errorPrecio, setErrorPrecio] = useState("");

  const [guardandoPrecio, setGuardandoPrecio] = useState(false);

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

  // Manejar selección de carpeta local con webkitdirectory
  function manejarSeleccionCarpeta(e: ChangeEvent<HTMLInputElement>) {
    const archivos = e.target.files;
    if (!archivos || archivos.length === 0) return;

    setErrorCreacion("");
    const extensionesValidas = new Set([
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".avif",
    ]);

    const fotosValidas: File[] = [];
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];
      const extension = "." + archivo.name.split(".").pop()?.toLowerCase();
      if (
        extensionesValidas.has(extension) ||
        archivo.type.startsWith("image/")
      ) {
        fotosValidas.push(archivo);
      }
    }

    if (fotosValidas.length === 0) {
      setErrorCreacion(
        "La carpeta seleccionada no contiene fotografías válidas (JPG, PNG o WebP)."
      );
      setArchivosSeleccionados([]);
      setNombreCarpeta("");
      return;
    }

    let carpetaNombre = "Carpeta seleccionada";
    const rutaRelativa = fotosValidas[0]?.webkitRelativePath;
    if (rutaRelativa && rutaRelativa.includes("/")) {
      carpetaNombre = rutaRelativa.split("/")[0];
    }

    setArchivosSeleccionados(fotosValidas);
    setNombreCarpeta(carpetaNombre);
  }

  // Manejador para crear evento y cargar fotografías
  async function manejarCrearEvento(eventoSubmit: FormEvent<HTMLFormElement>) {
    eventoSubmit.preventDefault();
    setErrorCreacion("");

    if (!nombreEvento.trim()) {
      setErrorCreacion("Por favor ingresa el nombre del evento.");
      return;
    }

    const validacionCosto = validarCostoFoto(costoFoto);
    if (!validacionCosto.valido) {
      setErrorCreacion(validacionCosto.mensaje);
      return;
    }

    if (archivosSeleccionados.length === 0) {
      setErrorCreacion(
        "Debes seleccionar una carpeta que contenga al menos una fotografía válida."
      );
      return;
    }

    setGuardando(true);
    setMensajeEstado("Creando evento...");

    let idEventoCreado: number | null = null;

    try {
      // 1. Crear el evento en MySQL y obtener idEvento y claves
      const respuestaEvento = await fetch("/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreEvento: nombreEvento.trim(),
          costoFoto: validacionCosto.valor,
        }),
      });

      const resultadoEvento = await respuestaEvento.json();

      if (!respuestaEvento.ok) {
        setErrorCreacion(resultadoEvento.mensaje || "Error al crear el evento");
        setGuardando(false);
        setMensajeEstado("");
        return;
      }

      idEventoCreado = resultadoEvento.idEvento;

      // 2. Subir fotografías en lotes controlados
      const TAMAÑO_LOTE = 8;
      const totalFotos = archivosSeleccionados.length;
      let fotosProcesadas = 0;

      setProgresoCarga({ actual: 0, total: totalFotos });
      setMensajeEstado(`Cargando 0 de ${totalFotos} fotografías...`);

      for (let i = 0; i < totalFotos; i += TAMAÑO_LOTE) {
        const lote = archivosSeleccionados.slice(i, i + TAMAÑO_LOTE);
        const formData = new FormData();

        for (const archivo of lote) {
          formData.append("fotos", archivo);
        }

        const respuestaLote = await fetch(
          `/api/eventosFotografo/${idEventoCreado}/fotos`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!respuestaLote.ok) {
          const errorLote = await respuestaLote.json().catch(() => ({}));
          throw new Error(
            errorLote.mensaje || "Error al procesar el lote de fotografías"
          );
        }

        fotosProcesadas += lote.length;
        setProgresoCarga({ actual: fotosProcesadas, total: totalFotos });
        setMensajeEstado(
          `Cargando ${fotosProcesadas} de ${totalFotos} fotografías...`
        );
      }

      // 3. Éxito total: guardar datos creados para mostrar claves y refrescar lista
      setEventoRecienCreado({
        idEvento: resultadoEvento.idEvento,
        claveEntrar: resultadoEvento.claveEntrar,
        claveVerificacionPago: resultadoEvento.claveVerificacionPago,
      });

      await cargarEventos();
      setNombreEvento("");
      setCostoFoto("");
      setArchivosSeleccionados([]);
      setNombreCarpeta("");
    } catch (error) {
      console.error("Error al crear evento y subir fotografías:", error);

      // Limpiar evento incompleto en caso de falla
      if (idEventoCreado) {
        await fetch(`/api/eventosFotografo/${idEventoCreado}/incompleto`, {
          method: "DELETE",
        }).catch(() => {});
      }

      setErrorCreacion(
        error instanceof Error
          ? error.message
          : "No se pudo completar la carga de fotografías"
      );
    } finally {
      setGuardando(false);
      setProgresoCarga(null);
      setMensajeEstado("");
    }
  }

  function cerrarModalCrear() {
    if (guardando) return; // Evitar cerrar durante la carga
    setModalCrearAbierto(false);
    setErrorCreacion("");
    setEventoRecienCreado(null);
    setNombreEvento("");
    setCostoFoto("");
    setArchivosSeleccionados([]);
    setNombreCarpeta("");
    setProgresoCarga(null);
    setMensajeEstado("");
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

  function mostrarMensajeAccion(mensaje: string) {
    setMensajeAccion(mensaje);
    window.setTimeout(() => setMensajeAccion(""), 4000);
  }
  function abrirEditarPrecio(evento: Evento) {
    setMenuEventoAbierto(null);
    setErrorPrecio("");
    setNuevoPrecio(formatearPrecio(evento.costoFoto));
    setEventoEditarPrecio(evento);
  }

  function cerrarEditarPrecio() {
    if (guardandoPrecio) return;

    setEventoEditarPrecio(null);
    setNuevoPrecio("");
    setErrorPrecio("");
  }

  function abrirRenombrar(evento: Evento) {
    setMenuEventoAbierto(null);
    setMensajeAccion("");
    setErrorRenombrar("");
    setNuevoNombre(evento.nombreEvento);
    setEventoRenombrar(evento);
  }

  function cerrarRenombrar() {
    if (guardandoNombre) return;
    setEventoRenombrar(null);
    setErrorRenombrar("");
    setNuevoNombre("");
  }


  async function manejarRenombrar(eventoSubmit: FormEvent<HTMLFormElement>) {
    eventoSubmit.preventDefault();

    if (!eventoRenombrar) return;

    const nombreLimpio = nuevoNombre.trim();

    if (!nombreLimpio) {
      setErrorRenombrar("El nombre del evento no puede estar vacío.");
      return;
    }

    if (nombreLimpio.length > 120) {
      setErrorRenombrar("El nombre no puede superar 120 caracteres.");
      return;
    }

    if (nombreLimpio === eventoRenombrar.nombreEvento) {
      cerrarRenombrar();
      return;
    }

    setGuardandoNombre(true);
    setErrorRenombrar("");

    try {
      const respuesta = await fetch(
        `/api/eventosFotografo/${eventoRenombrar.idEvento}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nombreEvento: nombreLimpio }),
        }
      );

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrorRenombrar(
          resultado.mensaje || "No se pudo renombrar el evento"
        );
        return;
      }

      const nombreAplicado =
        typeof resultado.nombreEvento === "string"
          ? resultado.nombreEvento
          : nombreLimpio;

      setEventos((anteriores) =>
        anteriores.map((evento) =>
          evento.idEvento === eventoRenombrar.idEvento
            ? { ...evento, nombreEvento: nombreAplicado }
            : evento
        )
      );

      setEventoRenombrar(null);
      setNuevoNombre("");
      mostrarMensajeAccion("Evento renombrado correctamente.");
    } catch (error) {
      console.error("Error al renombrar evento:", error);
      setErrorRenombrar("No se pudo conectar con el servidor");
    } finally {
      setGuardandoNombre(false);
    }
  }

  function abrirEliminar(evento: Evento) {
    setMenuEventoAbierto(null);
    setMensajeAccion("");
    setErrorEliminar("");
    setEventoEliminar(evento);
  }

  function cerrarEliminar() {
    if (eliminandoEvento) return;
    setEventoEliminar(null);
    setErrorEliminar("");
  }

  async function manejarEliminar() {
    if (!eventoEliminar) return;

    setEliminandoEvento(true);
    setErrorEliminar("");

    try {
      const respuesta = await fetch(
        `/api/eventosFotografo/${eventoEliminar.idEvento}`,
        { method: "DELETE" }
      );

      const resultado = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrorEliminar(
          resultado.mensaje || "No se pudo eliminar el evento"
        );
        return;
      }

      setEventos((anteriores) =>
        anteriores.filter(
          (evento) => evento.idEvento !== eventoEliminar.idEvento
        )
      );

      setEventoEliminar(null);
      mostrarMensajeAccion(
        typeof resultado.advertencia === "string"
          ? resultado.advertencia
          : "Evento eliminado correctamente."
      );
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      setErrorEliminar("No se pudo conectar con el servidor");
    } finally {
      setEliminandoEvento(false);
    }
  }

  async function manejarEditarPrecio(
    eventoSubmit: FormEvent<HTMLFormElement>
  ) {
    eventoSubmit.preventDefault();

    if (!eventoEditarPrecio) return;

    const validacion = validarCostoFoto(nuevoPrecio);

    if (!validacion.valido) {
      setErrorPrecio(validacion.mensaje);
      return;
    }

    setGuardandoPrecio(true);
    setErrorPrecio("");

    try {
      const respuesta = await fetch(
        `/api/eventosFotografo/${eventoEditarPrecio.idEvento}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            costoFoto: validacion.valor,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setErrorPrecio(
          resultado.mensaje || "No se pudo actualizar el precio"
        );
        return;
      }

      setEventos((anteriores) =>
        anteriores.map((evento) =>
          evento.idEvento === eventoEditarPrecio.idEvento
            ? { ...evento, costoFoto: validacion.valor }
            : evento
        )
      );

      setEventoEditarPrecio(null);
      setNuevoPrecio("");

      mostrarMensajeAccion(
        "Precio por fotografía actualizado correctamente."
      );
    } catch (error) {
      console.error("Error al actualizar precio:", error);
      setErrorPrecio("No se pudo conectar con el servidor");
    } finally {
      setGuardandoPrecio(false);
    }
  }

  return (
    <div className="contenedorEventosFotografo paginaConDesplazamiento">
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
      </div>


      {/* Título de la sección */}
      <h2 className="tituloSeccionEventos">Recientemente agregado</h2>

      <div className="areaDesplazableArchivos" role="region" aria-label="Eventos del fotógrafo" tabIndex={0} onScroll={() => setMenuEventoAbierto(null)}>
        {mensajeAccion && (
          <p
            className="modalMensajeExito"
            role="status"
            style={{ marginBottom: "14px" }}
          >
            {mensajeAccion}
          </p>
        )}

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
                  <article
                    key={evento.idEvento}
                    className="tarjetaEvento tarjetaEventoConOpciones"
                  >
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
                          Costo: ${formatearPrecio(evento.costoFoto)} por foto
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
                        aria-label={`Opciones de ${evento.nombreEvento}`}
                        aria-haspopup="menu"
                        aria-expanded={menuEventoAbierto?.idEvento === evento.idEvento}
                        onClick={(clic) => alternarMenuEvento(evento.idEvento, clic.currentTarget)}
                      >
                        ···
                      </button>

                      {menuEventoAbierto?.idEvento === evento.idEvento && (
                        <>
                          <button
                            type="button"
                            className="capaCierreMenu"
                            aria-label="Cerrar opciones del evento"
                            onClick={() => setMenuEventoAbierto(null)}
                          />

                          <div className="menuOpcionesEvento" role="menu" style={menuEventoAbierto.posicion}>
                            <button
                              type="button"
                              role="menuitem"
                              className="opcionMenuEvento"
                              onClick={() => abrirRenombrar(evento)}
                            >
                              Renombrar evento
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                className="opcionMenuEvento"
                                onClick={() => abrirEditarPrecio(evento)}
                              >
                                Editar precio por foto
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="opcionMenuEvento opcionMenuEventoPeligro"
                              onClick={() => abrirEliminar(evento)}
                            >
                              Eliminar evento
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
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
              Agregar evento
            </h3>

            {eventoRecienCreado ? (
              // Vista de claves recién creadas
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                <p className="modalMensajeExito">¡Evento creado y fotografías cargadas exitosamente!</p>

                <div className="infoClavesCaja">
                  <div className="filaClave">
                    <span className="etiquetaClave">ID del Evento:</span>
                    <div className="valorClaveContenedor">
                      <span className="valorClave">{eventoRecienCreado.idEvento}</span>
                    </div>
                  </div>

                  <div className="filaClave">
                    <span className="etiquetaClave">Clave para que el cliente entre:</span>
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
              // Formulario estándar con 3 campos
              <form className="modalFormulario" onSubmit={manejarCrearEvento}>
                {/* 1. Nombre del evento */}
                <div className="modalCampo">
                  <label htmlFor="nombreEventoInput" className="modalEtiqueta">
                    Nombre del evento
                  </label>
                  <input
                    id="nombreEventoInput"
                    type="text"
                    placeholder="Ingresar nombre"
                    value={nombreEvento}
                    onChange={(e) => setNombreEvento(e.target.value)}
                    className="modalInput"
                    required
                    disabled={guardando}
                    autoFocus
                  />
                </div>

                {/* 2. Costo por fotografía */}
                <div className="modalCampo">
                  <label htmlFor="costoFotoInput" className="modalEtiqueta">
                    Costo por fotografía
                  </label>
                  <input
                    id="costoFotoInput"
                    type="number"
                    min="0"
                    max="999999.99"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Ingresar costo"
                    value={costoFoto}
                    onChange={(e) => setCostoFoto(e.target.value)}
                    className="modalInput"
                    required
                    disabled={guardando}
                  />
                </div>

                {/* 3. Seleccionar carpeta de fotografías */}
                <div className="modalCampo">
                  <label className="modalEtiqueta">Carpeta de fotografías</label>
                  <input
                    type="file"
                    ref={inputCarpetaRef}
                    // @ts-expect-error webkitdirectory es estándar en navegadores para seleccionar carpetas
                    webkitdirectory=""
                    directory=""
                    multiple
                    style={{ display: "none" }}
                    onChange={manejarSeleccionCarpeta}
                    disabled={guardando}
                  />

                  {archivosSeleccionados.length === 0 ? (
                    <button
                      type="button"
                      className="botonSeleccionarCarpeta"
                      onClick={() => inputCarpetaRef.current?.click()}
                      disabled={guardando}
                    >
                      <span aria-hidden="true"><svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                      </span>
                      <span>Seleccionar carpeta</span>
                    </button>
                  ) : (
                    <div className="cajaCarpetaSeleccionada">
                      <div className="infoCarpetaSeleccionada">
                        <span className="nombreCarpetaSeleccionada">
                          {nombreCarpeta}
                        </span>
                        <span className="cantidadFotosSeleccionadas">
                          {archivosSeleccionados.length} fotografías seleccionadas
                        </span>
                      </div>
                      <button
                        type="button"
                        className="botonCambiarCarpeta"
                        onClick={() => inputCarpetaRef.current?.click()}
                        disabled={guardando}
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>

                {/* Indicador de progreso real */}
                {guardando && (
                  <div className="contenedorProgresoCarga">
                    {progresoCarga && (
                      <div className="barraProgresoFondo">
                        <div
                          className="barraProgresoRelleno"
                          style={{
                            width: `${
                              (progresoCarga.actual / progresoCarga.total) * 100
                            }%`,
                          }}
                        />
                      </div>
                    )}
                    <p className="textoEstadoCarga">{mensajeEstado}</p>
                  </div>
                )}

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

      {/* MODAL 3: RENOMBRAR EVENTO */}
      {eventoRenombrar && (
        <div className="modalFondo" onClick={cerrarRenombrar}>
          <div
            className="modalCaja"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalRenombrar"
          >
            <h3 id="tituloModalRenombrar" className="modalTitulo">
              Renombrar evento
            </h3>

            <form className="modalFormulario" onSubmit={manejarRenombrar}>
              <div className="modalCampo">
                <label
                  htmlFor="nuevoNombreEvento"
                  className="modalEtiqueta"
                >
                  Nombre del evento
                </label>
                <input
                  id="nuevoNombreEvento"
                  type="text"
                  className="modalInput"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  maxLength={120}
                  required
                  disabled={guardandoNombre}
                  autoFocus
                />
              </div>

              {errorRenombrar && (
                <p className="modalMensajeError">{errorRenombrar}</p>
              )}

              <div className="modalBotones">
                <button
                  type="button"
                  className="botonPill"
                  onClick={cerrarRenombrar}
                  disabled={guardandoNombre}
                >
                  Cancelar
                </button>

                <Boton
                  texto={guardandoNombre ? "Guardando..." : "Guardar"}
                  ancho={150}
                  alto={42}
                  type="submit"
                  disabled={guardandoNombre}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {eventoEditarPrecio && (
        <div className="modalFondo" onClick={cerrarEditarPrecio}>
          <div
            className="modalCaja"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloEditarPrecio"
          >
            <h3 id="tituloEditarPrecio" className="modalTitulo">
              Editar precio por fotografía
            </h3>

            <form
              className="modalFormulario"
              onSubmit={manejarEditarPrecio}
            >
              <div className="modalCampo">
                <label
                  htmlFor="nuevoPrecioFoto"
                  className="modalEtiqueta"
                >
                  Nuevo precio por fotografía
                </label>

                <input
                  id="nuevoPrecioFoto"
                  type="number"
                  min="0"
                  max="999999.99"
                  step="0.01"
                  className="modalInput"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  disabled={guardandoPrecio}
                  required
                />
              </div>

              {errorPrecio && (
                <p className="modalMensajeError">{errorPrecio}</p>
              )}

              <div className="modalBotones">
                <button
                  type="button"
                  className="botonPill"
                  onClick={cerrarEditarPrecio}
                  disabled={guardandoPrecio}
                >
                  Cancelar
                </button>

                <Boton
                  texto={guardandoPrecio ? "Guardando..." : "Guardar precio"}
                  ancho={160}
                  alto={42}
                  type="submit"
                  disabled={guardandoPrecio}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ELIMINAR EVENTO */}
      {eventoEliminar && (
        <div className="modalFondo" onClick={cerrarEliminar}>
          <div
            className="modalCaja"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloModalEliminar"
          >
            <h3 id="tituloModalEliminar" className="modalTitulo">
              Eliminar evento
            </h3>

            <p className="modalTexto">
              ¿Seguro que deseas eliminar el evento{" "}
              <strong>{eventoEliminar.nombreEvento}</strong>? Se eliminarán sus
              fotografías y los accesos de los clientes. Esta acción no se puede
              deshacer.
            </p>

            {errorEliminar && (
              <p className="modalMensajeError">{errorEliminar}</p>
            )}

            <div className="modalBotones">
              <button
                type="button"
                className="botonPill"
                onClick={cerrarEliminar}
                disabled={eliminandoEvento}
              >
                Cancelar
              </button>

              <Boton
                texto={
                  eliminandoEvento ? "Eliminando..." : "Eliminar definitivamente"
                }
                ancho={210}
                alto={42}
                onClick={manejarEliminar}
                disabled={eliminandoEvento}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
