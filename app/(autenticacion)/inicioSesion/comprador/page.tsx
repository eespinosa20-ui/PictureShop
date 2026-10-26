import FormularioInicioSesion from "../formularioInicioSesion";

export const metadata = {
  title: "Inicio de Sesión - Comprador",
  description: "Página de inicio de sesión para compradores",
};

export default function PaginaComprador() {
  return <FormularioInicioSesion tipo="comprador" />;
}