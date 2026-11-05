import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from "react";

type PropiedadesBoton =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    texto: ReactNode;
    ancho?: CSSProperties["width"];
    alto?: CSSProperties["height"];
    variante?: "primario" | "secundario";
  };

export default function Boton({
  texto,
  ancho,
  alto,
  variante = "primario",
  type = "button",
  style,
  className = "",
  ...propiedades
}: PropiedadesBoton) {
  return (
    <button
      {...propiedades}
      type={type}
      className={`botonGeneral boton-${variante} ${className}`}
      style={{
        width: ancho,
        height: alto,
        ...style,
      }}
    >
      {texto}
    </button>
  );
}