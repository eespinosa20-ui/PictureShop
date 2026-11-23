"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Boton from "@/app/(componentes)/botones/boton";
import NavegacionCarpetas from "@/app/(componentes)/navegacion/navegacionCarpetas";
import {
  actualizarFotosCarrito,
  escucharSeleccionCarrito,
  obtenerCarritoEvento,
} from "@/app/(componentes)/carrito/apiCarrito";

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
  const [seleccion, setSeleccion] = useState<{ idEvento: number; fotos: Set<number> } | null>(null);
  const [procesando, setProcesando] = useState(false);
  const operacionEnCurso = useRef(false);
  const carritoDisponible = Boolean(seleccion && evento && seleccion.idEvento === evento.idEvento);
  const enCarrito = carritoDisponible && Boolean(seleccion?.fotos.has(Number(idFoto)));
  const [mensajeAccion, setMensajeAccion] = useState("");
  const [mensajeAccionEsError, setMensajeAccionEsError] = useState(false);
  const temporizadorMensaje = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    function manejarTeclado(evento: KeyboardEvent) {
      const elemento = evento.target as HTMLElement;

      // Evitar navegación mientras se escribe
      if (
        elemento.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(elemento.tagName)
      ) {
        return;
      }

      if (evento.key === "ArrowLeft" && idFotoAnterior !== null) {
        evento.preventDefault();

        router.push(
          `/eventosFoto/${idFotoAnterior}?idEvento=${idEventoParam}`
        );
      }

      if (evento.key === "ArrowRight" && idFotoSiguiente !== null) {
        evento.preventDefault();

        router.push(
          `/eventosFoto/${idFotoSiguiente}?idEvento=${idEventoParam}`
        );
      }
    }

    window.addEventListener("keydown", manejarTeclado);

    return () => {
      window.removeEventListener("keydown", manejarTeclado);
    };
  }, [idFotoAnterior, idFotoSiguiente, idEventoParam, router]);

  useEffect(() => {
    let activa = true;
    let seleccionActualizada = false;
    const idEventoConsulta = idEventoParam || "1";
    const dejarDeEscuchar = escucharSeleccionCarrito(idEventoConsulta, (carrito) => {
      seleccionActualizada = true;
      setSeleccion({ idEvento: carrito.idEvento, fotos: new Set(carrito.fotos.map((item) => item.idFoto)) });
    });

    async function cargarDetalleFoto() {
      if (!idFoto) return;

      try {
        setCargando(true);
        setError("");

        // Si tenemos idEvento lo pasamos en la ruta, si no, primero cargamos con el idFoto
        const respuesta = await fetch(
          `/api/eventosCliente/${idEventoConsulta}/fotos/${idFoto}`,
          { method: "GET" }
        );

        const resultado = await respuesta.json();
        if (!activa) return;

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

        const resultadoCarrito = await obtenerCarritoEvento(
          resultado.evento.idEvento
        );

        if (!activa || seleccionActualizada) return;
        if (resultadoCarrito.exito) {
          setSeleccion({
            idEvento: resultado.evento.idEvento,
            fotos: new Set(resultadoCarrito.datos.fotos.map((item) => item.idFoto)),
          });
        } else {
          setSeleccion(null);
          setMensajeAccion(resultadoCarrito.mensaje);
          setMensajeAccionEsError(true);
        }
      } catch (err) {
        console.error("Error al cargar detalle de foto:", err);
        if (activa) setError("No se pudo conectar con el servidor");
      } finally {
        if (activa) setCargando(false);
      }
    }

    cargarDetalleFoto();
    return () => {
      activa = false;
      dejarDeEscuchar();
    };
  }, [idFoto, idEventoParam]);

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

  async function alternarFoto() {
    if (!evento || !foto || foto.idFoto !== Number(idFoto) || !carritoDisponible || operacionEnCurso.current) {
      return;
    }

    operacionEnCurso.current = true;
    setProcesando(true);

    try {
      const errorOperacion = await actualizarFotosCarrito(evento.idEvento, [foto.idFoto], !enCarrito);
      if (errorOperacion !== null) {
        mostrarMensajeCarrito(errorOperacion, true);
        return;
      }

      mostrarMensajeCarrito(enCarrito ? "Fotografía quitada del carrito." : "Fotografía agregada al carrito.");
    } finally {
      operacionEnCurso.current = false;
      setProcesando(false);
    }
  }

  return (
    <div className="contenedorDetalleFoto">
      <NavegacionCarpetas
        elementos={[
          { texto: "Tus eventos", ruta: "/eventos", titulo: "Volver a Tus eventos" },
          evento
            ? {
                texto: evento.nombreEvento,
                ruta: `/eventosCarpeta/${evento.idEvento}`,
                icono: "carpeta",
                titulo: `Volver al evento ${evento.nombreEvento}`,
              }
            : { texto: "Evento" },
          { texto: foto?.nombreFoto ?? "Fotografía", icono: "fotografia" },
        ]}
      />

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


              {/* Botón de carrito según Figma página 9 */}
              <button
                type="button"
                className={`botonCarritoPill ${
                  enCarrito ? "botonCarritoPillAgregado" : ""
                }`}
                style={{ padding: "8px 24px" }}
                onClick={alternarFoto}
                disabled={!carritoDisponible || procesando}
                title={enCarrito ? "Quitar del carrito" : "Agregar al carrito"}
                aria-label={enCarrito ? "Quitar del carrito" : "Agregar al carrito"}
                aria-pressed={enCarrito}
              >
                {enCarrito ? (
                  <svg
                    width="20"
                    height="20"
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
                    width="20"
                    height="20"
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
