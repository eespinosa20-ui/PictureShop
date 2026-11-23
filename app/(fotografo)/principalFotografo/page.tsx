
export default function PrincipalFotografo() {
  return (
    <section className="principalFotografo">
      <div className="contenidoPrincipalFotografo">

        {/* Encabezado de bienvenida */}
        <div className="bienvenidaFotografo">
          <h1>Bienvenido</h1>
          <p>¿Qué emociones capturamos hoy?</p>
        </div>

        {/* Recuadro de instrucciones */}
        <div className="tarjetaGuiaFotografo">

          <div className="instruccionesFotografo">
            <p>1. Captura los momentos del evento</p>

            <p>2. Ve a la pestaña eventos y agrega tu evento</p>

            <p>3. Sube tu carpeta a eventos</p>

            <p>
              4. Brinda el método de pago a tu comprador
              y espera para dar el código de acceso
              a la carpeta
            </p>
          </div>

          {/* Icono de cámara */}
          <div className="camaraGuiaFotografo">
            <svg
              viewBox="0 0 120 100"
              width="100"
              height="85"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 28 H29 L36 15 H72 L79 28 H105 Q112 28 112 36 V86 Q112 93 105 93 H15 Q8 93 8 86 V36 Q8 28 15 28 Z" />
              <circle cx="60" cy="61" r="23" />
              <circle cx="96" cy="40" r="3" fill="currentColor" stroke="none" />
            </svg>
          </div>

          {/* Nota informativa */}
          <p className="notaGuiaFotografo">
            Nota: Recuerda decirle a tu comprador los
            diferentes métodos de pago de manera externa.
          </p>

        </div>
      </div>
    </section>
  );
}
