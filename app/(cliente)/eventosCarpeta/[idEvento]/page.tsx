"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Boton from "@/app/(componentes)/botones/boton";
import NavegacionCarpetas from "@/app/(componentes)/navegacion/navegacionCarpetas";
import { formatearPrecio } from "@/app/(componentes)/utilidades/precio";
import {
  agregarFotoCarrito,
  notificarCarritoActualizado,
  obtenerCarritoEvento,
} from "@/app/(componentes)/carrito/apiCarrito";

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
  const [idsFotosCarrito, setIdsFotosCarrito] = useState<Set<number>>(
    new Set()
  );
  const [idFotoAgregando, setIdFotoAgregando] = useState<number | null>(null);
  const [agregandoTodas, setAgregandoTodas] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState("");
  const [mensajeAccionEsError, setMensajeAccionEsError] = useState(false);
  const temporizadorMensaje = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    async function cargarFotosEvento() {
      if (!idEvento) return;

      try {
        setCargando(true);
        setError("");

        const [respuesta, resultadoCarrito] = await Promise.all([
          fetch(`/api/eventosCliente/${idEvento}/fotos`, { method: "GET" }),
          obtenerCarritoEvento(idEvento),
        ]);

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          setError(
            resultado.mensaje || "Error al cargar las fotografías del evento"
          );
          return;
        }

        setEvento(resultado.evento);
        setFotos(resultado.fotos || []);

        if (resultadoCarrito.exito) {
          setIdsFotosCarrito(
            new Set(resultadoCarrito.datos.fotos.map((foto) => foto.idFoto))
          );
        }
      } catch (err) {
        console.error("Error al cargar fotos de evento:", err);
        setError("No se pudo conectar con el servidor");
      } finally {
        setCargando(false);
      }
    }

    cargarFotosEvento();
  }, [idEvento]);

  useEffect(() => {
    return () => {
      if (temporizadorMensaje.current) {
        clearTimeout(temporizadorMensaje.current);
      }
    };
  }, []);

  function mostrarMensajeCarrito(texto: string, esError = false) {
    setMensajeAccion(texto);
    setMensajeAccionEsError(esError);

    if (temporizadorMensaje.current) {
      clearTimeout(temporizadorMensaje.current);
    }

    temporizadorMensaje.current = setTimeout(() => {
      setMensajeAccion("");
    }, 3500);
  }

  async function manejarAgregarFoto(foto: FotoCliente) {
    if (
      idFotoAgregando !== null ||
      agregandoTodas ||
      idsFotosCarrito.has(foto.idFoto)
    ) {
      return;
    }

    setIdFotoAgregando(foto.idFoto);

    try {
      const resultado = await agregarFotoCarrito(idEvento, foto.idFoto);

      if (!resultado.exito) {
        mostrarMensajeCarrito(resultado.mensaje, true);
        return;
      }

      setIdsFotosCarrito(
        new Set(resultado.datos.carrito.fotos.map((item) => item.idFoto))
      );
      mostrarMensajeCarrito(
        resultado.datos.yaExistia
          ? "La fotografía ya estaba en el carrito."
          : "Fotografía agregada al carrito."
      );
    } finally {
      setIdFotoAgregando(null);
    }
  }

  async function manejarSeleccionarTodas() {
    if (agregandoTodas || fotos.length === 0) {
      return;
    }

    const fotosPendientes = fotos.filter(
      (foto) => !idsFotosCarrito.has(foto.idFoto)
    );

    if (fotosPendientes.length === 0) {
      mostrarMensajeCarrito("Todas las fotografías ya están en el carrito.");
      return;
    }

    setAgregandoTodas(true);

    try {
      for (const foto of fotosPendientes) {
        const resultado = await agregarFotoCarrito(idEvento, foto.idFoto, false);

        if (!resultado.exito) {
          notificarCarritoActualizado();
          mostrarMensajeCarrito(resultado.mensaje, true);
          return;
        }

        setIdsFotosCarrito(
          new Set(resultado.datos.carrito.fotos.map((item) => item.idFoto))
        );
      }

      notificarCarritoActualizado();
      mostrarMensajeCarrito("Todas las fotografías fueron agregadas al carrito.");
    } finally {
      setAgregandoTodas(false);
    }
  }

  return (
    <div className="contenedorInteriorEventoCliente">
      <NavegacionCarpetas
        elementos={[
          { texto: "Recientemente agregado", ruta: "/eventos", titulo: "Volver a Recientemente agregado" },
          { texto: evento?.nombreEvento ?? "Cargando...", icono: "carpeta" },
        ]}
      />

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
          {fotos.length > 0 && (
            <Boton
              texto={
                agregandoTodas
                  ? "Agregando..."
                  : idsFotosCarrito.size >= fotos.length
                    ? "Todas seleccionadas"
                    : "Seleccionar todas"
              }
              ancho={190}
              alto={42}
              onClick={manejarSeleccionarTodas}
              disabled={
                agregandoTodas ||
                idFotoAgregando !== null ||
                idsFotosCarrito.size >= fotos.length
              }
              title="Agregar todas las fotografías al carrito"
            />
          )}

          {mensajeAccion && (
            <p
              className={
                mensajeAccionEsError
                  ? "modalMensajeError"
                  : "modalMensajeExito"
              }
              role={mensajeAccionEsError ? "alert" : "status"}
            >
              {mensajeAccion}
            </p>
          )}

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
                      className={`botonCarritoPill ${
                        idsFotosCarrito.has(foto.idFoto)
                          ? "botonCarritoPillAgregado"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        manejarAgregarFoto(foto);
                      }}
                      disabled={
                        idsFotosCarrito.has(foto.idFoto) ||
                        idFotoAgregando !== null ||
                        agregandoTodas
                      }
                      title={
                        idsFotosCarrito.has(foto.idFoto)
                          ? "Fotografía en el carrito"
                          : idFotoAgregando === foto.idFoto
                            ? "Agregando..."
                            : "Agregar al carrito"
                      }
                      aria-label={
                        idsFotosCarrito.has(foto.idFoto)
                          ? "Fotografía en el carrito"
                          : "Agregar al carrito"
                      }
                      aria-pressed={idsFotosCarrito.has(foto.idFoto)}
                    >
                      {idsFotosCarrito.has(foto.idFoto) ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                      )}
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
