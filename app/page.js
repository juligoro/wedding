import RsvpForm from "@/components/RsvpForm";

const couplePhotos = [
  { src: "/couple-photos/img-6634.jpg", alt: "Juli y Tomi abrazados frente al mar" },
  { src: "/couple-photos/img-9679.jpg", alt: "Juli y Tomi con vista a la ciudad" },
  { src: "/couple-photos/img-9509.jpg", alt: "Juli y Tomi de viaje" },
  { src: "/couple-photos/img-0502.jpg", alt: "Juli y Tomi sonriendo al sol" },
  { src: "/couple-photos/img-2668.jpg", alt: "Juli y Tomi junto al puente" },
  { src: "/couple-photos/img-9502.jpg", alt: "Juli y Tomi junto al lago" },
  { src: "/couple-photos/img-9370.jpg", alt: "Juli y Tomi juntos" },
  { src: "/couple-photos/img-3042.jpg", alt: "Juli y Tomi celebrando" },
  { src: "/couple-photos/img-3745.jpg", alt: "Juli y Tomi de paseo" },
  { src: "/couple-photos/img-2369.jpg", alt: "Juli y Tomi de viaje juntos" },
  { src: "/couple-photos/img-6869.jpg", alt: "Juli y Tomi compartiendo una sonrisa" },
  { src: "/couple-photos/img-8653.jpg", alt: "Juli y Tomi en una escapada" },
  { src: "/couple-photos/img-9063.jpg", alt: "Juli y Tomi abrazados" },
];
const carouselPhotos = [...couplePhotos, couplePhotos[0]];

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

        <section className="photo-section" aria-labelledby="fotos-title">
          <h2 id="fotos-title" className="hidden">
            Fotos
          </h2>
          <div className="photo-carousel">
            <div className="photo-carousel-track">
              {carouselPhotos.map((photo, index) => (
                <figure
                  className="photo-carousel-slide"
                  key={`${photo.src}-${index}`}
                  aria-hidden={index === couplePhotos.length}
                >
                  <img src={photo.src} alt={photo.alt} loading={index < 2 ? "eager" : "lazy"} />
                </figure>
              ))}
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
