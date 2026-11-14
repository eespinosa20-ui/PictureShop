
import { inicioSesionCliente } from
  "@/servidor/autenticacion/inicioSesionCliente";
import { crearSesion } from
  "@/servidor/autenticacion/sesion";

export async function POST(request: Request) {
  try {
    const formularioDatos = await request.formData();

    const correo = formularioDatos.get("correo");
    const contrasena = formularioDatos.get("contrasena");

    if (
      typeof correo !== "string" ||
      typeof contrasena !== "string" ||
      !correo.trim() ||
      !contrasena.trim()
    ) {
      return Response.json(
        { mensaje: "Campos incompletos" },
        { status: 400 }
      );
    }

    const idCliente = await inicioSesionCliente(
      correo,
      contrasena
    );

    if (idCliente === null) {
      return Response.json(
        { mensaje: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Credenciales correctas: crear sesion
    await crearSesion(idCliente, "cliente");

    return Response.json(
      { mensaje: "Inicio de sesion exitoso" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error al iniciar sesion:", error);

    return Response.json(
      { mensaje: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
