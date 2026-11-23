"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import Boton from "@/app/(componentes)/botones/boton";
import type { CompraMomentos } from "@/servidor/cliente/momentosCliente";

interface PedidoMomentos {
  idEvento: number;
  nombreEvento: string;
  fechaPedido: string;
  estado: CompraMomentos["estadoPedido"];
  idsFotos: Set<number>;
}

interface DatosEvento {
  idEvento: number;
  nombreFotografo: string | null;
}

function agruparCompras(compras: CompraMomentos[]) {
  const pedidos = new Map<number, PedidoMomentos>();
  for (const compra of compras) {
    let pedido = pedidos.get(compra.idPedido);
    if (!pedido) {
      pedido = {
        idEvento: compra.idEvento,
        nombreEvento: compra.nombreEvento,
        fechaPedido: compra.fechaPedido,
        estado: compra.estadoPedido,
        idsFotos: new Set(),
      };
      pedidos.set(compra.idPedido, pedido);
    }
    pedido.idsFotos.add(compra.idFoto);
  }
  return pedidos;
}

const etiquetasPedido = {
  pendiente: "Pendiente de verificación",
  desbloqueado: "Descarga habilitada",
  cancelado: "Cancelado",
};

export default function PaginaMomentos() {
  const [compras, setCompras] = useState<CompraMomentos[] | null>(null);
  const [eventos, setEventos] = useState<Map<number, DatosEvento>>(new Map());
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [idPedido, setIdPedido] = useState<number | null>(null);
  const [errorClave, setErrorClave] = useState("");
  const [verificando, setVerificando] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const solicitudVerificacion = useRef<AbortController | null>(null);

  useEffect(() => {
    const control = new AbortController();

    async function cargarCompras() {
      try {
        const respuesta = await fetch("/api/momentos", { signal: control.signal, cache: "no-store" });
        if (!respuesta.ok) throw new Error("No se pudieron consultar tus compras.");
        const datos: { compras: CompraMomentos[] } = await respuesta.json();
        if (control.signal.aborted) return;
        setCompras(datos.compras);
        setError("");
      } catch {
        if (!control.signal.aborted) setError("No se pudieron consultar tus compras.");
      }
    }

    void cargarCompras();
    void fetch("/api/eventosCliente", { signal: control.signal, cache: "no-store" })
      .then(async (respuesta) => {
        if (!respuesta.ok) return;
        const datos: { eventos: DatosEvento[] } = await respuesta.json();
        if (!control.signal.aborted) {
          setEventos(new Map(datos.eventos.map((evento) => [evento.idEvento, evento])));
        }
      })
      .catch(() => {
        // La lista de pedidos sigue disponible si faltan los datos del evento.
      });
    return () => control.abort();
  }, []);

  useLayoutEffect(() => {
    const modal = dialogo.current;
    const campos = formulario.current;
    return () => {
      solicitudVerificacion.current?.abort();
      modal?.close();
      campos?.reset();
    };
  }, []);

  function abrirVerificacion(pedido: number) {
    setIdPedido(pedido);
    setErrorClave("");
    dialogo.current?.showModal();
  }

  function cerrarVerificacion() {
    dialogo.current?.close();
    formulario.current?.reset();
  }

  async function manejarVerificacion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (idPedido === null || solicitudVerificacion.current) return;

    const clave = new FormData(evento.currentTarget).get("clave");
    const control = new AbortController();
    solicitudVerificacion.current = control;
    setVerificando(true);
    setErrorClave("");

    try {
      const respuesta = await fetch(`/api/momentos/${idPedido}/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
        signal: control.signal,
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json();
        if (!control.signal.aborted) setErrorClave(datos.mensaje);
        return;
      }

      if (control.signal.aborted) return;
      setCompras((actuales) => actuales?.map((compra) =>
        compra.idPedido === idPedido ? { ...compra, estadoPedido: "desbloqueado" } : compra
      ) ?? null);
      cerrarVerificacion();
    } catch {
      if (!control.signal.aborted) setErrorClave("No se pudo verificar el pago. Intenta de nuevo.");
    } finally {
      solicitudVerificacion.current = null;
      setVerificando(false);
    }
  }

  const termino = busqueda.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
  const numeroBuscado = termino.match(/^(?:pedido\s*)?#?\s*(\d+)$/)?.[1];
  const fechaBuscada = termino.replace(/\s*([/-])\s*/g, "$1");
  const pedidos = Array.from(agruparCompras(compras ?? [])).filter(([id, pedido]) => {
    if (numeroBuscado !== undefined) return String(id).includes(numeroBuscado);
    const fechaAlternativa = pedido.fechaPedido.split("/").reverse().join("-");
    return pedido.nombreEvento.trim().replace(/\s+/g, " ").toLocaleLowerCase("es").includes(termino)
      || pedido.fechaPedido.includes(fechaBuscada)
      || fechaAlternativa.includes(fechaBuscada);
  });

  return (
    <div className="contenedorEventosCliente contenedorMomentos">
      <div className="contenedorBuscador" role="search">
        <input
          type="search"
          className="inputBuscador"
          placeholder="Buscar por pedido, fecha o evento..."
          aria-label="Buscar por pedido, fecha o evento"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
        <span className="iconoBuscador" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
      </div>

      <h1 className="tituloSeccionEventos">Revive la emocion</h1>
      {error ? (
        <p className="modalMensajeError" role="alert">{error}</p>
      ) : compras === null ? (
        <p className="estadoVacio" role="status">Cargando tus fotografías…</p>
      ) : compras.length === 0 && !termino ? (
        <p className="estadoVacio">Tus fotografías aparecerán aquí cuando registres un pedido.</p>
      ) : pedidos.length === 0 ? (
        <p className="estadoVacio">No se encontraron pedidos.</p>
      ) : (
        <div className="listaEventos">
          {pedidos.map(([pedido, { idEvento, nombreEvento, fechaPedido, estado, idsFotos }]) => {
            const evento = eventos.get(idEvento);

            return (
              <article key={pedido} className="tarjetaEvento resumenCarritoCliente"
                aria-label={`${nombreEvento}, pedido ${pedido}`}>
                <div className="tarjetaEventoContenido">
                  <div className="iconoCarpetaEvento" aria-hidden="true">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                  </div>
                  <div className="detallesEvento">
                    <p><strong>Pedido #{pedido}</strong></p>
                    <p>Fecha del pedido: {fechaPedido}</p>
                    <p>Autor: {evento?.nombreFotografo || "Fotógrafo"}</p>
                    <p className="nombreAlbum">Álbum: {nombreEvento}</p>
                    <p>Fotografías adquiridas: {idsFotos.size}</p>
                    <p>{etiquetasPedido[estado]}</p>
                  </div>
                </div>
                <div className="accionesTarjetaEvento">
                  {estado === "pendiente" && (
                    <button type="button" className="botonPill"
                      aria-label={`Clave de verificación del pedido ${pedido}`}
                      aria-haspopup="dialog" onClick={() => abrirVerificacion(pedido)}>
                      Clave de verificación
                    </button>
                  )}
                  {estado === "desbloqueado" && (
                    <a className="botonPill"
                      aria-label={`Descargar fotografías del pedido ${pedido}`}
                      href={`/api/momentos/${pedido}/descargar`}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4" />
                      </svg>
                      &nbsp;Descargar
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <dialog
        ref={dialogo}
        className="modalCaja modalCliente modalVerificacionMomentos"
        aria-labelledby="tituloVerificacionMomentos"
        onCancel={(evento) => {
          evento.preventDefault();
          if (!solicitudVerificacion.current) cerrarVerificacion();
        }}
      >
        <h2 id="tituloVerificacionMomentos" className="modalTitulo">Estos momentos ya casi son tuyos</h2>
        <form ref={formulario} className="modalFormulario" onSubmit={manejarVerificacion}>
          <label className="modalCampo">
            <span className="modalEtiqueta">Ingresar clave</span>
            <input
              className="modalInput"
              name="clave"
              type="password"
              autoComplete="off"
              autoFocus
              required
              maxLength={120}
            />
          </label>
          {errorClave && <p className="modalMensajeError" role="alert">{errorClave}</p>}
          <div className="modalBotones">
            <Boton texto="Cancelar" variante="secundario" onClick={cerrarVerificacion} disabled={verificando} />
            <Boton texto={verificando ? "Verificando…" : "Verificar"} type="submit" disabled={verificando} />
          </div>
        </form>
      </dialog>
    </div>
  );
}
