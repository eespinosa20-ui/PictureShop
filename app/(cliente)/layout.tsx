import type { ReactNode } from "react";
import ContenedorCliente from "./contenedorCliente";
import "./style.css";

export default function LayoutCliente({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ContenedorCliente>
      {children}
    </ContenedorCliente>
  );
}