import { inicioSesionCliente} from "@/servidor/autenticacion/inicioSesionCliente";

export async function POST(request: Request) {

  try {

    const formularioDatos = await request.formData()
    const correo = formularioDatos.get('correo')
    const contrasena = formularioDatos.get('contrasena')

    if (
      typeof correo !== 'string' ||
      typeof contrasena !== 'string'
    ) {
      return new Response('Datos de formulario inválidos', { status: 400 })
    }


    if (
      !correo.trim() ||
      !contrasena.trim() 
    ) {
      return Response.json(
        { mensaje: "Campos incompletos o tipo de usuario invalido" },
        { status: 400 }
      );
    }

    const inicioSesionExitoso = await inicioSesionCliente(correo, contrasena);

    if (!inicioSesionExitoso) {
        return Response.json(
            { mensaje: "Correo o contraseña incorrectos" },
            { status: 401 }
        );
    }

    return Response.json(
      { status: 200, mensaje: "Inicio de sesión exitoso. Redirigiendo..." }
    );

  } catch (error) {
    console.error("Error al verificar inicio de sesión:", error);


    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
