import FormularioRegistro from "../formularioRegistro";

export const metadata = {
  title: "Registro - Fotografo",
  description: "Página de registro para fotógrafos",
};

export default function PaginaRegistroFotografo() {
  return <FormularioRegistro tipo="fotografo" />;
}