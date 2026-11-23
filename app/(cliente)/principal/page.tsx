
export default function PrincipalCliente() {
  return (
    <section className="principalCliente">
      <div className="contenidoPrincipalCliente">
        <div className="bienvenidaCliente">
          <h1>Bienvenido a Picture-Shop</h1>
          <p>Capturando emociones</p>
        </div>

        <div className="tarjetaGuiaCliente">
          <h2>Guía de uso</h2>

          <div className="instruccionesCliente">
            <div className="filaGuiaCliente">
              <span className="flechaGuiaCliente">&gt;</span>
              <div className="detalleGuiaCliente">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2 2 11h3v11h6v-7h2v7h6V11h3L12 2z" />
                </svg>
                <div>
                  <strong>Principal:</strong>
                  <p>En esta sección encontrarás la guía de uso.</p>
                </div>
              </div>
            </div>

            <div className="filaGuiaCliente">
              <span className="flechaGuiaCliente">&gt;</span>
              <div className="detalleGuiaCliente">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m4 20 4-10 6 6-10 4Z" />
                  <path d="m8 10 6 6" />
                  <path d="m12 3 1 3M18 5l-2 2M21 11l-3-1M7 3l1 3M17 15l3 2" />
                </svg>
                <div>
                  <strong>Eventos:</strong>
                  <p>
                    En esta sección podrás consultar los eventos,
                    seleccionar fotografías y agregarlas a tu
                    carrito de compras.
                  </p>
                </div>
              </div>
            </div>

            <div className="filaGuiaCliente">
              <span className="flechaGuiaCliente">&gt;</span>
              <div className="detalleGuiaCliente">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 19h11a4 4 0 0 0 .5-8A7 7 0 0 0 5 9a5 5 0 0 0 2 10Z" />
                </svg>
                <div>
                  <strong>Momentos:</strong>
                  <p>
                    Aquí encontrarás tus fotografías adquiridas
                    y podrás descargarlas después de verificar
                    el pago.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="notaGuiaCliente">
            Nota: Las fotografías permanecerán disponibles
            según el periodo establecido para cada evento.
          </p>
        </div>
      </div>
    </section>
  );
}
