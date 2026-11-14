import Image from "next/image";
import Link from "next/link";

export default function PaginaPrincipalFotografo() {
  return (
    <div className="contenedorPrincipalFotografo">
      <header className="encabezadoBienvenidaFotografo">
        <h1 className="tituloBienvenida">Bienvenido</h1>
        <p className="subtituloBienvenida">¿Qué emociones capturamos hoy?</p>
      </header>

      <div className="seccionGuiaFotografo">
        <ol className="listaPasosFotografo">
          <li>
            <span className="numeroPaso">1.</span> Captura los momentos del evento
          </li>
          <li>
            <span className="numeroPaso">2.</span> Sube tu carpeta a eventos
          </li>
          <li>
            <span className="numeroPaso">3.</span> Brinda el método de pago a tu comprador y espera para dar el código de acceso a la carpeta
          </li>
        </ol>

        <div className="ilustracionCamaraFotografo">
          <Image
            src="/imagenBienvenida.png"
            alt="Capturando emociones"
            width={180}
            height={180}
            className="imagenCamara"
            priority
          />
        </div>

        <p className="notaExternaFotografo">
          <strong>Nota:</strong> Recuerda decirle a tu comprador los diferentes métodos de pago de manera externa.
        </p>

        <div className="accionesInicioFotografo">
          <Link href="/eventosFotografo" className="botonAccesoEventos">
            Ir a mis eventos
          </Link>
        </div>
      </div>
    </div>
  );
}
