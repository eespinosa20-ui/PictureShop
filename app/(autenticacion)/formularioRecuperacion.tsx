"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import Boton from "../(componentes)/botones/boton";
import {
  esTipoUsuario, esTokenRecuperacion, maximoContrasena,
  mensajeEnlaceInvalido, mensajeSolicitud,
} from "./datosRecuperacion";
import { evaluarContrasena } from "./requisitosContrasena";

function suscribirFragmento(notificar: () => void) {
  window.addEventListener("hashchange", notificar);
  return () => window.removeEventListener("hashchange", notificar);
}

function leerToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get("token");
}

function sinTokenEnServidor() {
  return undefined;
}

export default function FormularioRecuperacion({
  tipo, restablecer,
}: {
  tipo: unknown;
  restablecer: boolean;
}) {
  const token = useSyncExternalStore(suscribirFragmento, leerToken, sinTokenEnServidor);
  const [mostrar, setMostrar] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const rolValido = esTipoUsuario(tipo);
  const enlaceInvalido = restablecer && (!rolValido ||
    (token !== undefined && !esTokenRecuperacion(token)));

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (procesando || !esTipoUsuario(tipo)) return;
    setError("");
    const campos = new FormData(evento.currentTarget);
    const contrasena = String(campos.get("contrasena") ?? "");
    const confirmarContrasena = campos.get("confirmarContrasena");

    if (restablecer) {
      if (!esTokenRecuperacion(token)) {
        setError(mensajeEnlaceInvalido);
        return;
      }
      if (!contrasena.trim() || !evaluarContrasena(contrasena).every(({ valido }) => valido)) {
        setError("Usa al menos 8 caracteres, incluido un carácter especial.");
        return;
      }
      if (contrasena !== confirmarContrasena) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    setProcesando(true);
    try {
      const respuesta = await fetch(restablecer ? "/api/restablecerContrasena" : "/api/recuperarContrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restablecer
          ? { tipo, token, contrasena, confirmarContrasena }
          : { tipo, correo: campos.get("correo") }),
      });
      const { mensaje } = await respuesta.json();
      if (!respuesta.ok) {
        if (!restablecer && respuesta.status === 429) setExito(mensajeSolicitud);
        else setError(mensaje);
        return;
      }

      if (restablecer) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      setExito(mensaje);
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <form className="formulario" method="post" onSubmit={enviar}>
      <div className="encabezadoFormulario">
        <h1>{restablecer ? "Restablecer contraseña" : "Recuperar contraseña"}</h1>
      </div>

      {exito ? <p className="mensajeExito" role="status">{exito}</p> :
        enlaceInvalido ? <p className="mensajeError" role="alert">{mensajeEnlaceInvalido}</p> :
        !rolValido ? <p className="mensajeError" role="alert">Selecciona el tipo de cuenta desde el inicio de sesión.</p> : (
        <>
          {restablecer ? (
            <>
              <div className="grupoCampo">
                <label htmlFor="contrasena">Nueva contraseña</label>
                <div className="campoContrasena">
                  <input id="contrasena" name="contrasena" type={mostrar ? "text" : "password"}
                    autoComplete="new-password" maxLength={maximoContrasena} required />
                  <button className="botonMostrar" type="button" aria-controls="contrasena confirmarContrasena"
                    onClick={() => setMostrar(!mostrar)}>
                    {mostrar ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <small>Usa al menos 8 caracteres, incluido un carácter especial.</small>
              </div>
              <div className="grupoCampo">
                <label htmlFor="confirmarContrasena">Confirmar nueva contraseña</label>
                <input id="confirmarContrasena" name="confirmarContrasena" type={mostrar ? "text" : "password"}
                  autoComplete="new-password" maxLength={maximoContrasena} required />
              </div>
            </>
          ) : (
            <div className="grupoCampo">
              <label htmlFor="correo">Correo electrónico</label>
              <input id="correo" name="correo" type="email" autoComplete="email" maxLength={80} required />
            </div>
          )}
          {error && <p className="mensajeError" role="alert">{error}</p>}
          <Boton texto={restablecer ? "Guardar nueva contraseña" : "Enviar enlace"}
            ancho="min(100%, 280px)" alto={50} type="submit" disabled={procesando || (restablecer && token === undefined)} />
        </>
      )}

      {restablecer && rolValido && !exito && (
        <p className="enlace"><Link href={`/recuperarContrasena?tipo=${tipo}`}>Solicitar otro enlace</Link></p>
      )}
      <p className="enlace">
        {rolValido ? <Link href={`/inicioSesion/${tipo}`}>Volver a iniciar sesión</Link> : (
          <>
            <Link href="/inicioSesion/cliente">Iniciar sesión como cliente</Link>
            {" · "}
            <Link href="/inicioSesion/fotografo">Iniciar sesión como fotógrafo</Link>
          </>
        )}
      </p>
    </form>
  );
}
