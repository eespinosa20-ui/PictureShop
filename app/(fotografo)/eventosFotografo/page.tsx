"use client";

import {
  useEffect,
  useState,
  useMemo,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from "react";
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

    const costoNumerico = Number(costoFoto);
    if (!Number.isFinite(costoNumerico) || costoNumerico < 0) {
      setErrorCreacion(
        "El costo por foto debe ser un número válido mayor o igual a 0."
      );
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
          costoFoto: costoNumerico,
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
        await fetch(`/api/eventosFotografo/${idEventoCreado}`, {
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
                    step="any"
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
    </div>
  );
}
