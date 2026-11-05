
import { existeCorreoFotografo, registrarUsuarioFotografo } from "@/servidor/autenticacion/registrarUsuarioFotografo";



export async function POST(request: Request) {

  try {

    const formularioDatos = await request.formData()
    const nombre = formularioDatos.get('nombre')
    const telefono = formularioDatos.get('telefono')
    const correo = formularioDatos.get('correo')
    const contrasena = formularioDatos.get('contrasena')

    if (
      typeof nombre !== 'string' ||
      typeof telefono !== 'string' ||
      typeof correo !== 'string' ||
      typeof contrasena !== 'string'
    ) {
      return new Response('Datos de formulario inválidos', { status: 400 })
    }


    if (
      !nombre.trim() ||
      !telefono.trim() ||
      !correo.trim() ||
      !contrasena.trim() 
    ) {
      return Response.json(
        { mensaje: "Campos incompletos o tipo de usuario invalido" },
        { status: 400 }
      );
    }
    const correoRegistrado = await existeCorreoFotografo(correo);

      if (correoRegistrado) {
        return Response.json(
          { mensaje: "El correo ya esta registrado" },
          { status: 409 }
        );
      }

    const idFotografo = await registrarUsuarioFotografo(nombre, telefono, correo, contrasena);




    return Response.json(
      {
        mensaje: "Datos recibidos correctamente",
        idFotografo: idFotografo
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error al registrar fotografo:", error);

    // Puede ocurrir si dos solicitudes usan el mismo correo.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return Response.json(
        { mensaje: "El correo ya esta registrado" },
        { status: 409 }
      );
    }

    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }

}

