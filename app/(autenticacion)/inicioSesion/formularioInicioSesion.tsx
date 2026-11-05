"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Boton from "../../(componentes)/botones/boton";
import { useRouter } from "next/navigation";


type DatosInicioSesion = {
  correo: string;
  contrasena: string;
};

type PropiedadesFormulario = {
  tipo: "cliente" | "fotografo";
};

export default function FormularioInicioSesion({
  tipo,
}: PropiedadesFormulario) {


  const [datos, setDatos] = useState<DatosInicioSesion>({
    correo: "",
    contrasena: "",
  });
  const router = useRouter(); 

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");


  function actualizarCampo(
    campo: keyof DatosInicioSesion,
    valor: string
  ) {
    setDatos((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensajeError("");

    if (!datos.correo.trim() || !datos.contrasena) {
      setMensajeError("Completa todos los campos.");
      return;
    }

    const rutaInisioSesion = `/api/inicioSesion/${tipo}`;

    const formularioDatos = new FormData();
    formularioDatos.append("correo", datos.correo);
    formularioDatos.append("contrasena", datos.contrasena);

     try {
      const respuesta = await fetch(rutaInisioSesion, {
        method: "POST",
        body: formularioDatos,
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeError(resultado.mensaje || "Error al iniciar sesión");
        return;
      }

      setMensajeExito(resultado.mensaje || "Datos enviados correctamente");

      const rutaPrincipal =
      tipo === "cliente"
        ? "/principal"
        : "/principalFotografo";

      setTimeout(() => {
        router.push(rutaPrincipal);
      }, 500);

      
    } catch (error) {
      console.error("Error de registro:", error);
      setMensajeError("No se pudo conectar con el servidor");
    }



  }

  return (
    <form className="formulario" onSubmit={iniciarSesion}>

      <div className="encabezadoFormulario">
        <h1>Inicio de sesión</h1>
      </div>

      {/* Correo electronico */}

      <div className="grupoCampo">
        <label htmlFor="correo">Correo electrónico</label>

        <input
          id="correo"
          type="email"
          placeholder="correo@ejemplo.com"
          value={datos.correo}
          onChange={(evento) =>
            actualizarCampo("correo", evento.target.value)
          }
          autoComplete="email"
          required
        />
      </div>

      {/* Contrasena */}

      <div className="grupoCampo">
        <label htmlFor="contrasena">Contraseña</label>

        <div className="campoContrasena">
          <input
            id="contrasena"
            type={mostrarContrasena ? "text" : "password"}
            placeholder="Introduce tu contraseña"
            value={datos.contrasena}
            onChange={(evento) =>
              actualizarCampo("contrasena", evento.target.value)
            }
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className="botonMostrar"
            onClick={() =>
              setMostrarContrasena(!mostrarContrasena)
            }
          >
            {mostrarContrasena ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {/* Recuperacion de contrasena */}

      <p className="enlace">
        <Link href={`/recuperarContrasena?tipo=${tipo}`}>
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      {/* Errores */}

      {mensajeError && (
        <p className="mensajeError" role="alert">
          {mensajeError}
        </p>
      )}

      {mensajeExito && (
        <p className="mensajeExito" role="status">
          {mensajeExito}
        </p>
      )}

      {/* Boton reutilizable */}

      <Boton
        texto="Iniciar sesión"
        ancho={250}
        alto={50}
        type="submit"
      />

      {/* Registro */}

      <p className="enlace">
        ¿No tienes una cuenta?{" "}
        <Link href={`/registro/${tipo}`}>
          Regístrate
        </Link>
      </p>

    </form>
  );
}