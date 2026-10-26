type Propiedades = {
  tipo: "comprador" | "fotografo";
};

export default function FormularioInicioSesion({
  tipo,
}: Propiedades) {
  return (
    <form>
      <h1>Ingresar</h1>

      <p>
        Acceso para {tipo}
      </p>

      <input
        type="text"
        placeholder="Usuario"
      />

      <input
        type="password"
        placeholder="Contraseña"
      />

      <button type="submit">
        Entrar
      </button>
    </form>
  );
}