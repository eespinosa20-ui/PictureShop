import FormularioRegistro from "../formularioRegistro";

export const metadata = {
  title: "Registro - Cliente",
  description: "Página de registro para clientes",
};

export default function PaginaRegistroCliente() {
  return <FormularioRegistro tipo="cliente" />;
} 