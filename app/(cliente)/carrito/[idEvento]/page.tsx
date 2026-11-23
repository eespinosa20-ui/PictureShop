"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Boton from "@/app/(componentes)/botones/boton";
import NavegacionCarpetas from "@/app/(componentes)/navegacion/navegacionCarpetas";
import { formatearPrecio } from "@/app/(componentes)/utilidades/precio";
import {
  confirmarPedidoCarrito,
  obtenerCarritoEvento,
  quitarFotoCarrito,
  type CarritoEvento,
} from "@/app/(componentes)/carrito/apiCarrito";

function formatearFecha(fecha: string | Date) {
  const valor = fecha instanceof Date ? fecha : new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "xx/xx/xxxx";
  }

  const dia = String(valor.getDate()).padStart(2, "0");
  const mes = String(valor.getMonth() + 1).padStart(2, "0");
  const anio = valor.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

export default function PaginaCarritoCliente() {
  const parametros = useParams();
  const router = useRouter();
  const idEvento = parametros.idEvento as string;

  const [carrito, setCarrito] = useState<CarritoEvento | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [idFotoQuitando, setIdFotoQuitando] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [fechaConfirmacion, setFechaConfirmacion] = useState<Date | null>(null);
  const modalConfirmacion = useRef<HTMLDialogElement>(null);
  const [mensaje, setMensaje] = useState("");
  const [mensajeEsError, setMensajeEsError] = useState(false);
  const [mensajePedido, setMensajePedido] = useState("");
  const confirmandoRef = useRef(false);
  const visitaCarrito = useRef(0);

  const [idFotoConfirmarQuitar, setIdFotoConfirmarQuitar] =
  useState<number | null>(null);

  useLayoutEffect(() => {
    const visita = visitaCarrito.current;
    return () => {
      visitaCarrito.current = visita + 1;
      setMensajePedido("");
    };
  }, [idEvento]);

  useEffect(() => {
    let cancelado = false;

    async function cargarCarrito() {
      const resultado = await obtenerCarritoEvento(idEvento);

      if (cancelado) return;

      if (!resultado.exito) {
        setError(resultado.mensaje);
        setCarrito(null);
      } else {
        setCarrito(resultado.datos);
        setError("");
      }

      setCargando(false);
    }

    cargarCarrito();

    return () => {
      cancelado = true;
    };
  }, [idEvento]);

  function mostrarMensaje(texto: string, esError = false) {
    setMensaje(texto);
    setMensajeEsError(esError);
  }

  function volverAlEvento() {
    router.push(`/eventosCarpeta/${idEvento}`);
  }

  async function manejarQuitarFoto(idFoto: number) {
    if (idFotoQuitando !== null) return;

    setIdFotoQuitando(idFoto);
    setMensaje("");

    try {
      const resultado = await quitarFotoCarrito(idEvento, idFoto);

      if (!resultado.exito) {
        mostrarMensaje(resultado.mensaje, true);
        return;
      }

      setCarrito(resultado.datos.carrito);
      mostrarMensaje("Fotografia quitada del carrito");
    } finally {
      setIdFotoQuitando(null);
    }
  }

  function abrirConfirmacionPedido() {
    setMensaje("");
    setFechaConfirmacion(new Date());
    modalConfirmacion.current?.showModal();
  }

  function cerrarConfirmacionPedido() {
    modalConfirmacion.current?.close();
    setFechaConfirmacion(null);
  }

  async function manejarConfirmarPedido() {
    if (confirmandoRef.current) return;

    if (!carrito || carrito.fotos.length === 0) {
      mostrarMensaje("El carrito esta vacio", true);
      return;
    }

    confirmandoRef.current = true;
    const visita = visitaCarrito.current;
    setConfirmando(true);
    setMensaje("");

    try {
      const resultado = await confirmarPedidoCarrito(idEvento);

      if (!resultado.exito) {
        mostrarMensaje(resultado.mensaje, true);
        return;
      }

      setCarrito({
        ...carrito,
        idCarrito: null,
        fotos: [],
        cantidad: 0,
        total: "0.00",
      });
      cerrarConfirmacionPedido();
      if (visita === visitaCarrito.current) {
        setMensajePedido(
          resultado.datos.notificacionEnviada
            ? "Tu pedido fue registrado correctamente. Se envió una notificación al fotógrafo para que se ponga en contacto contigo y coordine el pago por transferencia bancaria."
            : "Tu pedido fue registrado correctamente. No se pudo enviar la notificación al fotógrafo."
        );
      }
    } finally {
      confirmandoRef.current = false;
      setConfirmando(false);
    }
  }

  const nombreEvento = carrito?.nombreEvento ?? "Evento";

  return (
    <div className="contenedorCarritoCliente">
      <NavegacionCarpetas
        elementos={[
          { texto: "Tus eventos", ruta: "/eventos", titulo: "Volver a Tus eventos" },
          {
            texto: nombreEvento,
            ruta: `/eventosCarpeta/${idEvento}`,
            icono: "carpeta",
            titulo: `Volver al evento ${nombreEvento}`,
          },
          { texto: "Carrito" },
        ]}
      />


      <div className="encabezadoCarritoCompra">
        <h1>Carrito de compras</h1>
        {carrito &&(
          <div className="resumenCarritoCompra">
            <div className="tarjetaInfoEventoCliente resumenCarritoCliente">
              <div className="detallesInfoEvento">
                <p>
                  <strong>Cantidad de fotografías:</strong>{" "}
                  {carrito.cantidad}
                </p>
                <p className="totalCarritoCliente">
                  <strong>Total:</strong> ${formatearPrecio(carrito.total)}
                </p>
              </div>

              <Boton
                texto="Finalizar compra"
                aria-haspopup="dialog"
                ancho={220}
                alto={48}
                onClick={abrirConfirmacionPedido}
                disabled={idFotoQuitando !== null || confirmando}
              />
            </div>
        </div>
        )}
        
      </div>

      {mensajePedido && (
        <p className="modalMensajeExito" role="status">{mensajePedido}</p>
      )}

      {!fechaConfirmacion && mensaje && (
        <p
          className={mensajeEsError ? "modalMensajeError" : "modalMensajeExito"}
          role={mensajeEsError ? "alert" : "status"}
        >
          {mensaje}
        </p>
      )}

      {cargando && (
        <div className="estadoVacio">
          <p>Cargando carrito...</p>
        </div>
      )}

      {!cargando && error && (
        <div className="estadoVacio">
          <p className="modalMensajeError">{error}</p>
          <Boton
            texto="Volver al evento"
            ancho={200}
            alto={44}
            onClick={volverAlEvento}
          />
        </div>
      )}

      {!cargando && !error && carrito && carrito.fotos.length === 0 && (
        <div className="estadoVacio">
          {!mensajePedido && (
            <p>Todavía no has seleccionado fotografías para este evento.</p>
          )}
          <Boton
            texto="Volver al evento"
            ancho={200}
            alto={44}
            onClick={volverAlEvento}
          />
        </div>
      )}

      {!cargando &&
        !error &&
        carrito &&
        carrito.fotos.length > 0 && (
          <>
            
        <div className="mensajeInformativoCarrito">
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
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>

          <p>
            Tienes fotografías seleccionadas. Revisa tu pedido
            antes de finalizar la compra.
          </p>
        </div>


            <div className="listaCarritoCliente">
              {carrito.fotos.map((foto) => (
                <article
                  key={foto.idFoto}
                  className="tarjetaInfoEventoCliente filaCarritoCliente"
                >
                  <div className="tarjetaInfoContenido">
                    <div className="iconoCarpetaGrande" aria-hidden="true">
                      <svg
                        width="44"
                        height="44"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>

                    <div className="detallesInfoEvento">
                      <p>
                        <strong>Fecha de publicación:</strong>{" "}
                        {formatearFecha(foto.fechaPublicacion)}
                      </p>
                      <p>
                        <strong>Autor:</strong>{" "}
                        {carrito.nombreFotografo || "Fotógrafo"}
                      </p>
                      <p>
                        <strong>Album:</strong> {carrito.nombreEvento}
                      </p>
                      <p>
                        <strong>Precio:</strong> $
                        {formatearPrecio(foto.costoFoto)}
                      </p>
                    </div>
                  </div>

                  <div className="accionesFilaCarrito">
                    <span className="botonPill etiquetaSeleccionadoCarrito">
                      Seleccionado
                    </span>
                    <button
                      type="button"
                      className="botonPill"
                      onClick={() => setIdFotoConfirmarQuitar(foto.idFoto)} 
                      disabled={idFotoQuitando !== null}
                      title={`Quitar ${foto.nombreFoto} del carrito`}
                      aria-label={`Quitar ${foto.nombreFoto} del carrito`}
                    >
                      {idFotoQuitando === foto.idFoto
                        ? "Quitando..."
                        : "Quitar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="tarjetaInfoEventoCliente resumenCarritoCliente">
              <div className="detallesInfoEvento">
                <p>
                  <strong>Cantidad de fotografías:</strong>{" "}
                  {carrito.cantidad}
                </p>
                <p className="totalCarritoCliente">
                  <strong>Total:</strong> ${formatearPrecio(carrito.total)}
                </p>
              </div>

              <Boton
                texto="Finalizar compra"
                aria-haspopup="dialog"
                ancho={220}
                alto={48}
                onClick={abrirConfirmacionPedido}
                disabled={idFotoQuitando !== null || confirmando}
              />
            </div>
          </>
        )}
      <dialog
        ref={modalConfirmacion}
        className="modalCaja modalCliente"
        aria-labelledby="tituloConfirmacionPedido"
        aria-describedby="avisoConfirmacionPedido"
        onCancel={(evento) => {
          evento.preventDefault();
          if (!confirmandoRef.current) cerrarConfirmacionPedido();
        }}
      >
        <h2 id="tituloConfirmacionPedido" className="modalTitulo">
          Confirmar pedido
        </h2>
        <p id="avisoConfirmacionPedido" className="modalTexto">
          Se notificará al fotógrafo sobre tu pedido. Posteriormente se pondrá en
          contacto contigo para coordinar el pago mediante transferencia bancaria.
        </p>

        {carrito && (
          <div className="modalFormulario">
            <div className="tarjetaInfoEventoCliente detallesInfoEvento">
              <p>
                <strong>Evento:</strong> {carrito.nombreEvento}
              </p>
              {fechaConfirmacion && (
                <p>
                  <strong>Fecha del pedido:</strong> {formatearFecha(fechaConfirmacion)}
                </p>
              )}
              <p>
                <strong>Fotografías seleccionadas:</strong> {carrito.cantidad}
              </p>
              <p>
                <strong>Estado:</strong> Pendiente
              </p>
              <p className="totalCarritoCliente">
                <strong>Total a pagar:</strong> ${formatearPrecio(carrito.total)}
              </p>
            </div>
            {mensajeEsError && mensaje && (
              <p className="modalMensajeError" role="alert">{mensaje}</p>
            )}
            <div className="modalBotones">
              <Boton
                texto="Cancelar"
                variante="secundario"
                onClick={cerrarConfirmacionPedido}
                disabled={confirmando}
                autoFocus
              />
              <Boton
                texto={confirmando ? "Confirmando..." : "Confirmar pedido"}
                onClick={manejarConfirmarPedido}
                disabled={confirmando}
              />
            </div>
          </div>
        )}
      </dialog>
      {idFotoConfirmarQuitar !== null && (
        <div
          className="modalFondo"
          onClick={() => setIdFotoConfirmarQuitar(null)}
        >
          <div
            className="modalCaja"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloQuitarFotografia"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="tituloQuitarFotografia" className="modalTitulo">
              Quitar fotografía
            </h3>

            <p className="modalTexto">
              ¿Estás seguro de que deseas quitar esta fotografía
              de tu carrito?
            </p>

            <div className="modalBotones">
              <button
                type="button"
                className="botonPill"
                onClick={() => setIdFotoConfirmarQuitar(null)}
                disabled={idFotoQuitando !== null}
              >
                Cancelar
              </button>

              <Boton
                texto={
                  idFotoQuitando !== null
                    ? "Quitando..."
                    : "Quitar fotografía"
                }
                ancho={170}
                alto={42}
                disabled={idFotoQuitando !== null}
                onClick={async () => {
                  if (idFotoConfirmarQuitar === null) return;

                  await manejarQuitarFoto(idFotoConfirmarQuitar);

                  setIdFotoConfirmarQuitar(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
