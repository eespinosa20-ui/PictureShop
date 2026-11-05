
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Boton from "../../(componentes)/botones/boton";
import { useRouter } from "next/navigation";


type Propiedades = {
  tipo: "cliente" | "fotografo";
};

type DatosRegistro = {
  nombre: string;
  telefono: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
};

export default function FormularioRegistro({
  tipo,
}: Propiedades) {
  const rutaRegistro =
    tipo === "cliente"
      ? "/api/registro/cliente"
      : "/api/registro/fotografo";
  const [datos, setDatos] = useState<DatosRegistro>({
    nombre: "",
    telefono: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
  });

  const [mostrarContrasena, setMostrarContrasena] =
    useState(false);

  const [errores, setErrores] = useState<
    Record<string, string>
  >({});

  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const router = useRouter(); 

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

    setMensajeError("");
    setMensajeExito("");
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

    if (datos.nombre.trim().length < 3) {
      nuevosErrores.nombre =
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
        "La contraseña no cumple los requisitos.";
    }

    if (
      datos.contrasena !== datos.confirmarContrasena
    ) {
      nuevosErrores.confirmarContrasena =
        "Las contraseñas no coinciden.";
    }
    if (!/^[0-9]{10}$/.test(datos.telefono)) {
        nuevosErrores.telefono =
        "El telefono debe contener 10 digitos.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };


const registrarUsuario = async (
  evento: FormEvent<HTMLFormElement>
) => {
  evento.preventDefault();
  setMensajeError("");
  setMensajeExito("");

  if (!validarFormulario()) {
    return;
  }

  const rutaRegistro =
    tipo === "cliente"
      ? "/api/registro/cliente"
      : "/api/registro/fotografo";

  const formularioDatos = new FormData();

  formularioDatos.append("nombre", datos.nombre);
  formularioDatos.append("telefono", datos.telefono);
  formularioDatos.append("correo", datos.correo);
  formularioDatos.append("contrasena", datos.contrasena);

  try {
    const respuesta = await fetch(rutaRegistro, {
      method: "POST",
      body: formularioDatos,
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      setMensajeError(resultado.mensaje || "Error al registrar usuario");
      return;
    }

    setMensajeExito(resultado.mensaje || "Datos recibidos correctamente");

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
};


  return (
      <form
        className="formulario"
        onSubmit={registrarUsuario}
        noValidate
      >
        <div className="encabezadoFormulario">
            <h1>Registro de nuevo usuario</h1>
        </div>

        {/* NOMBRE COMPLETO */}

        <div className="grupoCampo">
          <label htmlFor="nombre">
            Nombre completo
          </label>

          <input
            id="nombre"
            type="text"
            autoComplete="" //qué hace autoComplete? es un atributo de HTML que permite a los navegadores rellenar automáticamente campos de formulario con información previamente ingresada por el usuario. Mejora la experiencia del usuario al reducir la cantidad de escritura necesaria y puede ayudar a prevenir errores tipográficos.
            placeholder="Ejemplo: Juan Perez"
            value={datos.nombre}
            onChange={(evento) =>
              actualizarCampo(
                "nombre",
                evento.target.value
              )
            }
          />

          {errores.nombre && (
            <span className="mensajeError">
              {errores.nombre}
            </span>
          )}
        </div>

        {/* NUMERO DE TELEFONO */}

        <div className="grupoCampo">
          <label htmlFor="telefono">
            Numero de telefono
          </label>

            <input
                id="telefono"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                maxLength={10}
                placeholder="Ejemplo: 4421234567"
                value={datos.telefono}
                onChange={(evento) =>
                    actualizarCampo(
                    "telefono",
                    evento.target.value
                    )
                }
            />
          

          {errores.telefono && (
            <span className="mensajeError">
              {errores.telefono}
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

        <Boton
            texto="Registrar"
            ancho={220}
            alto={50}
            type="submit"
        />

        {/* MENSAJES DEL FORMULARIO */}

        {mensajeError && (
          <p className="mensajeError" role="alert">
            {mensajeError}
          </p>
        )}

        {mensajeExito && (
          <p className="mensajeInformacion" role="status">
            {mensajeExito}
          </p>
        )}

        {/* ENLACE A INICIO DE SESION */}

        <p className="enlace">
          ¿Ya tienes una cuenta?{" "}
          <Link href={`/inicioSesion/${tipo}`}>
            Iniciar sesion
          </Link>
        </p>
      </form>
  );
}
