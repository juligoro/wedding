import RsvpForm from "@/components/RsvpForm";

export default function Home() {
  return (
    <>
      <main className="page">
        <section className="hero" aria-label="Inicio">
          <div className="hero-inner">
            <div className="logo-crop" aria-label="Logo Juli y Tomi">
              <img className="monogram" src="/logo-juli-tomi-cropped.svg" alt="Juli y Tomi" />
            </div>
            <p className="eyebrow">¡NOS CASAMOS!</p>
            <p className="hero-date">6 de diciembre 2026</p>
          </div>
        </section>

        <section className="section alt" aria-labelledby="historia-title">
          <div className="wrap">
            <div className="section-title">
              <h2 id="historia-title">Queremos compartir nuestra felicidad con ustedes</h2>
              <p>
                Después de tanto soñarlo, llegó el día de rodearnos de las
                personas que más queremos para dar este gran paso juntos. Los esperamos para
                vivir esta celebración llena de amor, alegría y emoción.
              </p>
              <div className="signature">Juli y Tomi</div>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="fotos-title">
          <div className="wrap">
            <h2 id="fotos-title" className="hidden">
              Fotos
            </h2>
            <div className="photo-grid">
              <div className="photo-frame" aria-label="Foto principal de Juli y Tomi" />
              <div className="photo-stack">
                <div className="photo-frame" aria-label="Foto secundaria de Juli y Tomi" />
                <div className="photo-frame" aria-label="Otra foto de Juli y Tomi" />
              </div>
            </div>
          </div>
        </section>

        <section className="section alt" aria-labelledby="detalles-title">
          <div className="wrap">
            <div className="section-title">
              <h2 id="detalles-title">La celebración</h2>
            </div>
            <div className="details-grid">
              <article className="detail">
                <h3>Ceremonia + Fiesta</h3>
                <p>
                  Domingo 6 de diciembre de 2026, desde las 14 hs.
                  <br />
                  Del Viso, Buenos Aires.
                  <span className="note">
                    La dirección exacta llega cuando confirmás asistencia.
                  </span>
                </p>
              </article>
              <article className="detail">
                <h3>Dresscode</h3>
                <p>
                  La ceremonia es afuera y va a hacer calor. Venite con ropa elegante, pero
                  fresca. Dejemos el blanco solo para la novia.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="rsvp" aria-labelledby="rsvp-title">
          <div className="wrap rsvp-layout">
            <aside className="rsvp-intro">
              <h2 id="rsvp-title">RSVP</h2>
              <p>Confirmá tu asistencia y completá la información para recibir los detalles.</p>
            </aside>
            <RsvpForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <strong>Juli &amp; Tomi</strong>
        Nos vemos para celebrar.
      </footer>
    </>
  );
}
