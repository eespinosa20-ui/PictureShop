
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Propiedades = {
  tipo: "comprador" | "fotografo";
};

type DatosRegistro = {
  nombreCompleto: string;
  numTelefono: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
};

export default function FormularioRegistro({
  tipo,
}: Propiedades) {
  const [datos, setDatos] = useState<DatosRegistro>({
    nombreCompleto: "",
    numTelefono: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
  });

  const [mostrarContrasena, setMostrarContrasena] =
    useState(false);

  const [errores, setErrores] = useState<
    Record<string, string>
  >({});

  const [mensaje, setMensaje] = useState("");

  const actualizarCampo = (
    campo: keyof DatosRegistro,
    valor: string | boolean
  ) => {
    setDatos((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErrores((anterior) => ({
      ...anterior,
      [campo]: "",
    }));

    setMensaje("");
  };

  const requisitosContrasena = [
    {
      texto: "Minimo 8 caracteres",
      valido: datos.contrasena.length >= 8,
    },
    {
      texto: "Un caracter especial",
      valido: /[^A-Za-z0-9]/.test(datos.contrasena),
    },
  ];

  const requisitosCumplidos =
    requisitosContrasena.filter(
      (requisito) => requisito.valido
    ).length;

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (datos.nombreCompleto.trim().length < 3) {
      nuevosErrores.nombreCompleto =
        "Ingresa tu nombre completo.";
    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        datos.correo.trim()
      )
    ) {
      nuevosErrores.correo =
        "Ingresa un correo electronico valido.";
    }

    if (requisitosCumplidos !== requisitosContrasena.length) {
      nuevosErrores.contrasena =
        "La contrasena no cumple los requisitos.";
    }

    if (
      datos.contrasena !== datos.confirmarContrasena
    ) {
      nuevosErrores.confirmarContrasena =
        "Las contrasenas no coinciden.";
    }
    if (!/^[0-9]{10}$/.test(datos.numTelefono)) {
        nuevosErrores.numTelefono =
        "El telefono debe contener 10 digitos.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  const registrarUsuario = (
    evento: FormEvent<HTMLFormElement>
  ) => {
    evento.preventDefault();
    setMensaje("");

    if (!validarFormulario()) {
      return;
    }

    // TODO:
    // Enviar datos al servidor mediante HTTPS.
    // Validar nuevamente los campos en el backend.
    // Comprobar que correo y usuario no existan.
    // Guardar la contrasena mediante un hash seguro.
    // Asignar el rol autorizado desde el servidor.
    // Nunca almacenar contrasenas en texto plano.

    setMensaje(
      "Formulario validado. La conexion con el servidor de registro esta pendiente."
    );
  };

  return (
      <form
        className="formularioRegistro"
        onSubmit={registrarUsuario}
        noValidate
      >
        <div className="encabezadoFormulario">
            <h1>Registro de nuevo usuario</h1>
        </div>

        {/* NOMBRE COMPLETO */}

        <div className="grupoCampo">
          <label htmlFor="nombreCompleto">
            Nombre completo
          </label>

          <input
            id="nombreCompleto"
            type="text"
            autoComplete="" //qué hace autoComplete? es un atributo de HTML que permite a los navegadores rellenar automáticamente campos de formulario con información previamente ingresada por el usuario. Mejora la experiencia del usuario al reducir la cantidad de escritura necesaria y puede ayudar a prevenir errores tipográficos.
            placeholder="Ejemplo: Juan Perez"
            value={datos.nombreCompleto}
            onChange={(evento) =>
              actualizarCampo(
                "nombreCompleto",
                evento.target.value
              )
            }
          />

          {errores.nombreCompleto && (
            <span className="mensajeError">
              {errores.nombreCompleto}
            </span>
          )}
        </div>

        {/* NUMERO DE TELEFONO */}

        <div className="grupoCampo">
          <label htmlFor="numTelefono">
            Numero de telefono
          </label>

            <input
                id="numTelefono"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                maxLength={10}
                placeholder="Ejemplo: 4421234567"
                value={datos.numTelefono}
                onChange={(evento) =>
                    actualizarCampo(
                    "numTelefono",
                    evento.target.value
                    )
                }
            />
          

          {errores.numTelefono && (
            <span className="mensajeError">
              {errores.numTelefono}
            </span>
          )}
        </div>

        {/* CORREO ELECTRONICO */}

        <div className="grupoCampo">
          <label htmlFor="correo">
            Correo electronico
          </label>

          <input
            id="correo"
            type="email"
            autoComplete=""
            placeholder="correo@ejemplo.com"
            value={datos.correo}
            onChange={(evento) =>
              actualizarCampo(
                "correo",
                evento.target.value
              )
            }
          />

          {errores.correo && (
            <span className="mensajeError">
              {errores.correo}
            </span>
          )}
        </div>

        {/* CONTRASENA */}

        <div className="grupoCampo grupoContrasena">
          <label htmlFor="contrasena">
            Contraseña
          </label>

          <div className="campoContrasena">
            <input
              id="contrasena"
              type={
                mostrarContrasena
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              placeholder="Crea una contrasena"
              value={datos.contrasena}
              onChange={(evento) =>
                actualizarCampo(
                  "contrasena",
                  evento.target.value
                )
              }
            />

            <button
              type="button"
              className="botonMostrar"
              onClick={() =>
                setMostrarContrasena(
                  (anterior) => !anterior
                )
              }
            >
              {mostrarContrasena
                ? "Ocultar"
                : "Mostrar"}
            </button>
          </div>

        {/* INDICADOR Y REQUISITOS DE CONTRASENA */}

        <div className="detallesContrasena">

        <div className="indicadorSeguridad">
            <div className="barraSeguridad">
            <div
                className="progresoSeguridad"
                style={{
                width: `${
                    (requisitosCumplidos /
                    requisitosContrasena.length) * 100
                }%`,
                backgroundColor:
                    requisitosCumplidos === 0
                    ? "#d9534f"
                    : requisitosCumplidos <
                        requisitosContrasena.length
                    ? "#e0a526"
                    : "#4b9b62",
                }}
            />
            </div>

            <span>
            Seguridad:{" "}
            {requisitosCumplidos === 0
                ? "Baja"
                : requisitosCumplidos <
                requisitosContrasena.length
                ? "Media"
                : "Alta"}
            </span>
        </div>

        <ul className="listaRequisitos">
            {requisitosContrasena.map((requisito) => (
            <li
                key={requisito.texto}
                className={
                requisito.valido
                    ? "requisitoValido"
                    : ""
                }
            >
                {requisito.valido ? "✓" : "○"}{" "}
                {requisito.texto}
            </li>
            ))}
        </ul>

        </div>       

          {errores.contrasena && (
            <span className="mensajeError">
              {errores.contrasena}
            </span>
          )}
        </div>

        {/* CONFIRMAR CONTRASENA */}

        <div className="grupoCampo">
          <label htmlFor="confirmarContrasena">
            Confirmar contrasena
          </label>

          <input
            id="confirmarContrasena"
            type={
              mostrarContrasena
                ? "text"
                : "password"
            }
            autoComplete="new-password"
            placeholder="Repite tu contrasena"
            value={datos.confirmarContrasena}
            onChange={(evento) =>
              actualizarCampo(
                "confirmarContrasena",
                evento.target.value
              )
            }
          />

          {errores.confirmarContrasena && (
            <span className="mensajeError">
              {errores.confirmarContrasena}
            </span>
          )}
        </div>

        {/* BOTON REGISTRO */}

        <button
          type="submit"
          className="botonRegistrar"
        >
          Registrar
        </button>

        {/* MENSAJE DEL FORMULARIO */}

        {mensaje && (
          <p className="mensajeInformacion" role="status">
            {mensaje}
          </p>
        )}

        {/* ENLACE A INICIO DE SESION */}

        <p className="enlaceInicioSesion">
          ¿Ya tienes una cuenta?{" "}
          <Link href={`/inicioSesion/${tipo}`}>
            Iniciar sesion
          </Link>
        </p>
      </form>
  );
}
