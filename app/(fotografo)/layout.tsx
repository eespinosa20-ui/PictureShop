import type { ReactNode } from "react";
import ContenedorFotografo from "./contenedorFotografo";
import "./style.css";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/servidor/autenticacion/sesion";

export const instant = false;

export default async function LayoutFotografo({
  children,
}: {
  children: ReactNode;
}) {
  const sesion = await obtenerSesion();

  if (!sesion || sesion.tipoUsuario !== "fotografo") {
    redirect("/inicioSesion/fotografo");
  }

  return (
    <ContenedorFotografo>
      {children}
    </ContenedorFotografo>
  );
}
