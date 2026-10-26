import FormularioRegistro from "../formularioRegistro";

export const metadata = {
  title: "Registro - Comprador",
  description: "Página de registro para compradores",
};

export default function PaginaRegistroComprador() {
  return <FormularioRegistro tipo="comprador" />;
}