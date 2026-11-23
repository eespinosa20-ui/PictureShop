"use client";

import { useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Boton from "@/app/(componentes)/botones/boton";
import { extensionPermitida, extensionesFotografia, fotosPorLote, maximoBytesFoto } from "@/app/(componentes)/fotografias/limitesCarga";

export type GestionFotos =
  | { tipo: "agregar" }
  | { tipo: "eliminar"; idFoto: number; nombreFoto: string };

interface Propiedades {
  gestion: GestionFotos;
  rutaFotos: string;
  cerrar: () => void;
  actualizarLista: (cantidad: number) => Promise<void>;
  retirarFoto: (idFoto: number) => void;
}

export default function ModalGestionFotos({ gestion, rutaFotos, cerrar, actualizarLista, retirarFoto }: Propiedades) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const carpeta = useRef<HTMLInputElement>(null);
  const individuales = useRef<HTMLInputElement>(null);
  const ocupado = useRef(false);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [nombreCarpeta, setNombreCarpeta] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [progreso, setProgreso] = useState<{ revisadas: number; total: number } | null>(null);
  const [procesando, setProcesando] = useState(false);
  const agregando = gestion.tipo === "agregar";
  const titulo = agregando ? "Agregar fotografías" : "Eliminar fotografía";

  useLayoutEffect(() => {
    const modal = dialogo.current;
    modal?.showModal();
    return () => modal?.close();
  }, []);

  function seleccionar(evento: ChangeEvent<HTMLInputElement>, esCarpeta: boolean) {
    const seleccion = Array.from(evento.target.files ?? []);
    evento.target.value = "";
    if (!seleccion.length) return;
    const fotos = esCarpeta ? seleccion.filter((archivo) => extensionPermitida(archivo.name)) : seleccion;
    setNombreCarpeta(esCarpeta ? seleccion[0].webkitRelativePath.split("/")[0] : "");
    setProgreso(null);
    setArchivos(fotos);
    setErrores(fotos.length ? [] : ["La carpeta no contiene fotografías JPG, PNG, WebP o AVIF."]);
  }

  async function subirFotos() {
    const fallidas: string[] = [];
    const validas = archivos.filter((archivo) => {
      const motivo = !extensionPermitida(archivo.name)
        ? "Formato no permitido."
        : !archivo.size || archivo.size > maximoBytesFoto
          ? "El archivo está vacío o supera los 25 MB."
          : "";
      if (motivo) fallidas.push(`${archivo.name}: ${motivo}`);
      return !motivo;
    });
    let guardadas = 0;
    const total = archivos.length;
    let revisadas = total - validas.length;
    setProgreso({ revisadas, total });

    for (let inicio = 0; inicio < validas.length; inicio += fotosPorLote) {
      const lote = validas.slice(inicio, inicio + fotosPorLote);
      try {
        const formulario = new FormData();
        formulario.set("cargaParcial", "1");
        for (const archivo of lote) formulario.append("fotos", archivo);
        const respuesta = await fetch(rutaFotos, { method: "POST", body: formulario });
        const datos = await respuesta.json().catch(() => null);
        if (!Array.isArray(datos?.fallidas) || typeof datos.cantidad !== "number") {
          throw new Error(datos?.mensaje || "No se pudo confirmar el lote.");
        }
        guardadas += datos.cantidad;
        for (const falla of datos.fallidas) {
          fallidas.push(`${falla.nombre}: ${falla.motivo}`);
        }
        revisadas += lote.length;
        setProgreso({ revisadas, total });
      } catch (error) {
        const motivo = error instanceof Error ? error.message : "Error de conexión.";
        fallidas.push(...lote.map((archivo) => `${archivo.name}: ${motivo}`));
        fallidas.push(...validas.slice(inicio + lote.length).map((archivo) => `${archivo.name}: no se intentó subir.`));
        break;
      }
    }

    if (validas.length) await actualizarLista(guardadas);
    setArchivos([]);
    setNombreCarpeta("");
    if (fallidas.length) {
      setErrores(fallidas);
    } else {
      cerrar();
    }
  }

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado.current || (agregando && !archivos.length)) return;
    ocupado.current = true;
    setProcesando(true);
    setErrores([]);
    try {
      if (gestion.tipo === "agregar") {
        await subirFotos();
      } else {
        const respuesta = await fetch(`${rutaFotos}/${gestion.idFoto}`, { method: "DELETE" });
        if (!respuesta.ok) {
          const datos = await respuesta.json().catch(() => null);
          throw new Error(datos?.mensaje || "No se pudo eliminar la fotografía.");
        }
        retirarFoto(gestion.idFoto);
        cerrar();
      }
    } catch (error) {
      setErrores([error instanceof Error ? error.message : "No se pudo completar la operación."]);
    } finally {
      ocupado.current = false;
      setProcesando(false);
    }
  }

  return (
    <dialog
      ref={dialogo}
      className="modalCaja modalGestionFotos"
      aria-labelledby="tituloGestionFotos"
      onCancel={(evento) => {
        evento.preventDefault();
        if (!ocupado.current) cerrar();
      }}
    >
      <h2 id="tituloGestionFotos" className="modalTitulo">{titulo}</h2>
      <form className="modalFormulario" aria-busy={procesando} onSubmit={confirmar}>
        {agregando ? (
          <>
            <input ref={carpeta} type="file" hidden multiple
              // @ts-expect-error webkitdirectory habilita la selección de directorios.
              webkitdirectory=""
              onChange={(evento) => seleccionar(evento, true)} />
            <input ref={individuales} type="file" hidden multiple accept={extensionesFotografia.join(",")}
              onChange={(evento) => seleccionar(evento, false)} />
            <div className="modalBotones">
              <Boton texto="Seleccionar carpeta" variante="secundario" disabled={procesando} onClick={() => carpeta.current?.click()} />
              <Boton texto="Seleccionar fotografías" variante="secundario" disabled={procesando} onClick={() => individuales.current?.click()} />
            </div>
            <div className="modalTexto">
              {nombreCarpeta && <div>Carpeta: {nombreCarpeta}</div>}
              <div>Fotografías seleccionadas: {archivos.length}</div>
            </div>
            {progreso && (
              <div role="status">
                <label>
                  {progreso.revisadas} de {progreso.total} fotografías revisadas{" "}
                  <progress value={progreso.revisadas} max={progreso.total} />
                </label>
              </div>
            )}
          </>
        ) : (
          <p className="modalTexto">
            ¿Seguro que deseas eliminar la fotografía &quot;{gestion.nombreFoto}&quot;? Esta acción no se puede deshacer.
          </p>
        )}
        {errores.length > 0 && (
          <div role="alert" className="modalMensajeError">
            {errores.map((error, indice) => <p key={indice}>{error}</p>)}
          </div>
        )}
        <div className="modalBotones">
          <Boton texto="Cancelar" variante="secundario" disabled={procesando} onClick={cerrar} />
          <Boton texto={titulo} type="submit" disabled={procesando || (agregando && !archivos.length)} />
        </div>
      </form>
    </dialog>
  );
}
