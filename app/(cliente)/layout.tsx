import type { ReactNode } from "react";
import ContenedorCliente from "./contenedorCliente";
import "./style.css";
import { redirect } from "next/navigation";
import { obtenerSesion } from
  "@/servidor/autenticacion/sesion";

export const instant = false;
export default async function LayoutCliente({
  children,
}: {
  children: ReactNode;
}) {
  const sesion = await obtenerSesion();
  console.log("Sesion obtenida:", sesion);

  if (!sesion || sesion.tipoUsuario !== "cliente") {
    redirect("/inicioSesion/cliente");
  }
  return (
    <ContenedorCliente>
      {children}
    </ContenedorCliente>
  );
}