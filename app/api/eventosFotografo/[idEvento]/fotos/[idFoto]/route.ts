import { obtenerSesion } from "@/servidor/autenticacion/sesion";
import { eliminarFotografia } from "@/servidor/fotos/eliminarFotografia";

export async function DELETE(
  _solicitud: Request,
  contexto: { params: Promise<{ idEvento: string; idFoto: string }> }
) {
  try {
    const sesion = await obtenerSesion();
    if (!sesion) return Response.json({ mensaje: "Debes iniciar sesión." }, { status: 401 });
    if (sesion.tipoUsuario !== "fotografo") {
      return Response.json({ mensaje: "No tienes permiso para eliminar fotografías." }, { status: 403 });
    }

    const parametros = await contexto.params;
    const idEvento = Number(parametros.idEvento);
    const idFoto = Number(parametros.idFoto);
    if (![parametros.idEvento, parametros.idFoto].every((id) => /^\d+$/.test(id)) ||
      ![idEvento, idFoto].every((id) => Number.isSafeInteger(id) && id > 0)) {
      return Response.json({ mensaje: "Identificador de evento o fotografía inválido." }, { status: 400 });
    }

    const resultado = await eliminarFotografia(sesion.idUsuario, idEvento, idFoto);
    if (resultado === "no_encontrada") {
      return Response.json({ mensaje: "Fotografía no encontrada en tus eventos." }, { status: 404 });
    }
    if (resultado === "comprada") {
      return Response.json({ mensaje: "La fotografía no se puede eliminar porque está asociada a pedidos." }, { status: 409 });
    }
    return Response.json({ mensaje: "Fotografía eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar una fotografía del evento:", error);
    return Response.json({ mensaje: "No se pudo eliminar la fotografía." }, { status: 500 });
  }
}
