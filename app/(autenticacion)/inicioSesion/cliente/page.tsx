import FormularioInicioSesion from "../formularioInicioSesion";

export const metadata = {
  title: "Inicio de Sesión - Cliente",
  description: "Página de inicio de sesión para clientes",
};

export default function PaginaCliente() {
  return <FormularioInicioSesion tipo="cliente" />;
}