import Countdown from "@/components/Countdown";
import PhotoGallery from "@/components/PhotoGallery";
import type { GalleryLabels, GalleryPhoto } from "@/components/PhotoGallery";
import Reveal from "@/components/Reveal";
import RsvpForm from "@/components/RsvpForm";
import { Divider, Icon, Sprig } from "@/components/Botanical";
import type { InvitePreviousResponse, InviteeContext } from "@/lib/types";
import { getMapUrl, getWazeUrl } from "@/lib/venue";

interface LandingCard {
  icon: string;
  title: string;
  lines: string[];
  note?: string;
}

interface LandingFaqItem {
  q: string;
  a: string[];
  links?: { label: string; href: string }[];
  // The exact venue location stays gated behind the invite link.
  personalizedOnly?: boolean;
}

interface LandingCopy {
  brand: string;
  homeAria: string;
  langCode: string;
  langHref: string;
  langLabel: string;
  heroLabel: string;
  date: string;
  location: string;
  scrollCue: string;
  introText: string;
  signature: string;
  galleryAria: string;
  galleryLabels: GalleryLabels;
  detailsAria: string;
  cards: LandingCard[];
  faqAria: string;
  faqKicker: string;
  faqItems: LandingFaqItem[];
  rsvpHeading: string;
  rsvpText: string;
  rsvpSubtext: string;
  rsvpNoticeTitle: string;
  rsvpNoticeBody: string;
  rsvpNoticeHelp: string;
  footerThanks: string;
  footerBack: string;
}

const couplePhotos: GalleryPhoto[] = [
  { src: "/couple-photos/img-6634.jpg", alt: "Juli y Tomi abrazados frente al mar", position: "45% 72%" },
  { src: "/couple-photos/img-9679.jpg", alt: "Juli y Tomi con vista a la ciudad", position: "50% 72%" },
  { src: "/couple-photos/img-9509.jpg", alt: "Juli y Tomi de viaje", position: "50% 60%" },
  { src: "/couple-photos/img-0502.jpg", alt: "Juli y Tomi sonriendo al sol", position: "52% 64%" },
  { src: "/couple-photos/img-2668.jpg", alt: "Juli y Tomi junto al puente", position: "26% 74%" },
  { src: "/couple-photos/img-9502.jpg", alt: "Juli y Tomi junto al lago", position: "36% 75%" },
  { src: "/couple-photos/img-9370.jpg", alt: "Juli y Tomi juntos", position: "50% 68%" },
  { src: "/couple-photos/img-3042.jpg", alt: "Juli y Tomi celebrando", position: "50% 72%" },
  { src: "/couple-photos/img-3745.jpg", alt: "Juli y Tomi de paseo", position: "50% 68%" },
  { src: "/couple-photos/img-2369.jpg", alt: "Juli y Tomi de viaje juntos", position: "50% 78%" },
  { src: "/couple-photos/img-6869.jpg", alt: "Juli y Tomi compartiendo una sonrisa", position: "50% 76%" },
  { src: "/couple-photos/img-8653.jpg", alt: "Juli y Tomi en una escapada", position: "50% 68%" },
  { src: "/couple-photos/img-9063.jpg", alt: "Juli y Tomi abrazados", position: "42% 60%" },
];

const copy: Record<string, LandingCopy> = {
  es: {
    brand: "Juli & Tomi",
    homeAria: "Inicio",
    langCode: "EN",
    langHref: "/en",
    langLabel: "Ver en inglés",
    heroLabel: "¡Nos casamos!",
    date: "6 de diciembre de 2026",
    location: "Del Viso, Buenos Aires",
    scrollCue: "Deslizá",
    introText:
      "Después de tanto soñarlo, llegó el día de rodearnos de las personas que más queremos para dar este gran paso juntos. Los esperamos para vivir esta celebración llena de amor, alegría y emoción.",
    signature: "Juli & Tomi",
    galleryAria: "Nuestras fotos",
    galleryLabels: {
      label: "Galería de fotos",
      prev: "Foto anterior",
      next: "Foto siguiente",
      go: "Ver foto",
    },
    detailsAria: "La celebración",
    cards: [
      {
        icon: "calendar",
        title: "Ceremonia + Fiesta",
        lines: ["Domingo 6 de diciembre de 2026", "Desde las 14 hs."],
      },
      {
        icon: "pin",
        title: "Lugar",
        lines: ["Del Viso, Buenos Aires."],
        note: "La dirección exacta llega cuando confirmás asistencia.",
      },
      {
        icon: "dress",
        title: "Dresscode",
        lines: [
          "La ceremonia es afuera y va a hacer calor. Venite con ropa elegante, pero fresca.",
        ],
        note: "Dejemos el blanco solo para la novia.",
      },
    ],
    faqAria: "Preguntas frecuentes",
    faqKicker: "Preguntas frecuentes",
    faqItems: [
      {
        q: "¿Cómo llego a la quinta?",
        a: [
          "La celebración es en Janos Quinta, Del Viso (Buenos Aires).",
          "Si vas en auto, podés navegar directo con estos links:",
        ],
        links: [
          { label: "Google Maps", href: getMapUrl() },
          { label: "Waze", href: getWazeUrl() },
        ],
        personalizedOnly: true,
      },
      {
        q: "¿Hay micro?",
        a: [
          "Sí. Hay barra libre y no queremos que nadie maneje si tomó, así que va a haber un micro desde y hacia CABA.",
          "Vamos a compartir las paradas y los horarios más cerca de la fecha. Indicá si lo necesitan cuando confirmes asistencia.",
        ],
      },
      {
        q: "¿Hay estacionamiento?",
        a: ["Sí, la quinta tiene estacionamiento para quienes vayan en auto."],
      },
      {
        q: "¿Qué me pongo?",
        a: [
          "Elegante pero fresco: la ceremonia es al aire libre y en diciembre va a hacer calor.",
          "Gran parte de la fiesta es sobre césped, así que mejor evitar el taco fino.",
          "El blanco queda reservado para la novia.",
        ],
      },
      {
        q: "¿Puedo sumar a alguien más?",
        a: [
          "La invitación es para las personas que figuran en tu link personalizado.",
          "Si tenés alguna duda con tu grupo, escribinos y lo vemos juntos.",
        ],
      },
      {
        q: "¿Hasta cuándo puedo confirmar?",
        a: [
          "Hasta el 31 de octubre.",
          "Hasta esa fecha también podés editar tu respuesta desde tu link personalizado si algo cambia.",
        ],
      },
    ],
    rsvpHeading: "Confirmá tu asistencia",
    rsvpText: "Confirmá tu asistencia y la de tu grupo familiar hasta el 31 de octubre.",
    rsvpSubtext: "Vas a recibir los detalles por correo.",
    rsvpNoticeTitle: "Confirmá con tu link personalizado",
    rsvpNoticeBody:
      "Te enviamos un link único por WhatsApp o correo para que confirmes tu asistencia y la de tu grupo. Abrí ese link para responder.",
    rsvpNoticeHelp: "¿No lo encontrás? Escribinos y te lo reenviamos.",
    footerThanks: "Nos vemos para celebrar.",
    footerBack: "Volver arriba",
  },
  en: {
    brand: "Juli & Tomi",
    homeAria: "Home",
    langCode: "ES",
    langHref: "/",
    langLabel: "View in Spanish",
    heroLabel: "We're getting married!",
    date: "December 6, 2026",
    location: "Del Viso, Buenos Aires",
    scrollCue: "Scroll",
    introText:
      "After dreaming about this moment for so long, the day is finally here! We can’t wait to be surrounded by the people we love most as we take this big step together and celebrate with all the love, laughter, and joy in our hearts.",
    signature: "Juli & Tomi",
    galleryAria: "Our photos",
    galleryLabels: {
      label: "Photo gallery",
      prev: "Previous photo",
      next: "Next photo",
      go: "View photo",
    },
    detailsAria: "The celebration",
    cards: [
      {
        icon: "calendar",
        title: "Ceremony + Party",
        lines: ["Sunday, December 6, 2026", "From 2:00 PM."],
      },
      {
        icon: "pin",
        title: "Venue",
        lines: ["Del Viso, Buenos Aires."],
        note: "The exact address will be sent after you confirm your attendance.",
      },
      {
        icon: "dress",
        title: "Dress code",
        lines: [
          "The ceremony will be outdoors and the weather will be warm. Please wear something elegant but fresh.",
        ],
        note: "White is reserved for the bride.",
      },
    ],
    faqAria: "Frequently asked questions",
    faqKicker: "FAQ",
    faqItems: [
      {
        q: "How do I get to the venue?",
        a: [
          "The celebration is at Janos Quinta, Del Viso (Buenos Aires).",
          "If you're driving, you can navigate straight there with these links:",
        ],
        links: [
          { label: "Google Maps", href: getMapUrl() },
          { label: "Waze", href: getWazeUrl() },
        ],
        personalizedOnly: true,
      },
      {
        q: "Is there a shuttle?",
        a: [
          "Yes. There will be an open bar and we don't want anyone driving after drinking, so there will be a shuttle from and to Buenos Aires City.",
          "We'll share the stops and times closer to the date. Let us know if you need it when you RSVP.",
        ],
      },
      {
        q: "Is there parking?",
        a: ["Yes, the venue has parking if you're coming by car."],
      },
      {
        q: "What should I wear?",
        a: [
          "Elegant but fresh: the ceremony is outdoors and December in Buenos Aires is warm.",
          "Much of the party is on grass, so thin heels are best avoided.",
          "White is reserved for the bride.",
        ],
      },
      {
        q: "Can I bring someone else?",
        a: [
          "The invitation is for the people listed on your personal link.",
          "If you have any questions about your group, message us and we'll sort it out together.",
        ],
      },
      {
        q: "When is the RSVP deadline?",
        a: [
          "October 31.",
          "Until then you can also edit your reply from your personal link if anything changes.",
        ],
      },
    ],
    rsvpHeading: "Confirm your attendance",
    rsvpText: "Please confirm your attendance and your family group's attendance by October 31.",
    rsvpSubtext: "You will receive the details by email.",
    rsvpNoticeTitle: "RSVP with your personal link",
    rsvpNoticeBody:
      "We sent you a unique link by WhatsApp or email to confirm your attendance and your group's. Open that link to reply.",
    rsvpNoticeHelp: "Can't find it? Message us and we'll resend it.",
    footerThanks: "See you there to celebrate.",
    footerBack: "Back to top",
  },
};

export default function WeddingLanding({
  locale = "es",
  invitee = null,
  previous = null,
}: {
  locale?: string;
  invitee?: InviteeContext | null;
  previous?: InvitePreviousResponse | null;
}) {
  const text = copy[locale] || copy.es;
  const greeting = invitee
    ? locale === "en"
      ? `Hi ${invitee.greeting}!`
      : `¡Hola ${invitee.greeting}!`
    : null;

  return (
    <>
      <a className="lang-switch" href={text.langHref} aria-label={text.langLabel}>
        {text.langCode}
      </a>

      <main className="page" id="top">
        <section className="hero" aria-label={text.homeAria}>
          <div className="hero-bg" aria-hidden="true">
            <span className="hero-glow" />
            <span className="hero-grain" />
          </div>
          <Sprig className="hero-sprig left" />
          <Sprig className="hero-sprig right" flip />

          <div className="hero-inner">
            <div className="logo-crop">
              <img className="monogram" src="/logo-juli-tomi-cropped.svg" alt={text.brand} />
            </div>
            <h1 className="hero-eyebrow">{text.heroLabel}</h1>
            <div className="hero-meta">
              <span className="hero-date">{text.date}</span>
            </div>
          </div>
        </section>

        <section className="section section-story" id="historia" aria-label={text.homeAria}>
          <div className="wrap">
            <Reveal className="story-body">
              <p className="lede">{text.introText}</p>
              <p className="signature">{text.signature}</p>
            </Reveal>
            <Reveal delay={150}>
              <Divider />
            </Reveal>
          </div>
        </section>

        <section className="section section-gallery" id="fotos" aria-label={text.galleryAria}>
          <div className="wrap">
            <Reveal variant="scale">
              <PhotoGallery photos={couplePhotos} labels={text.galleryLabels} />
            </Reveal>
          </div>
        </section>

        <section className="section section-details" id="detalles" aria-label={text.detailsAria}>
          <div className="wrap">
            <Reveal>
              <Countdown locale={locale} />
            </Reveal>

            <div className="details-grid">
              {text.cards.map((card, i) => (
                <Reveal as="article" className="detail-card" key={card.title} delay={i * 110}>
                  <span className="detail-icon">
                    <Icon name={card.icon} />
                  </span>
                  <h3>{card.title}</h3>
                  <div className="detail-lines">
                    {card.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  {card.note ? <p className="note">{card.note}</p> : null}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-faq" id="faq" aria-label={text.faqAria}>
          <div className="wrap">
            <Reveal className="faq-head">
              <p className="kicker">{text.faqKicker}</p>
            </Reveal>
            <div className="faq-list">
              {text.faqItems
                .filter((item) => !item.personalizedOnly || invitee)
                .map((item, i) => (
                  <Reveal key={item.q} delay={i * 90}>
                    <details className="faq-item">
                      <summary>
                        <span className="faq-question">{item.q}</span>
                        <span className="faq-chevron" aria-hidden="true">
                          +
                        </span>
                      </summary>
                      <div className="faq-body">
                        {item.a.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        {item.links ? (
                          <div className="faq-links">
                            {item.links.map((link) => (
                              <a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </details>
                  </Reveal>
                ))}
            </div>
          </div>
        </section>

        <section className="section section-rsvp" id="rsvp" aria-label={text.rsvpHeading}>
          <div className="wrap rsvp-layout">
            <Reveal as="aside" className="rsvp-intro">
              {greeting ? <p className="rsvp-greeting">{greeting}</p> : null}
              <h2 id="rsvp-title">{text.rsvpHeading}</h2>
              <p className="rsvp-lead">{text.rsvpText}</p>
              <p className="rsvp-sub">{text.rsvpSubtext}</p>
              <Sprig className="rsvp-sprig" />
            </Reveal>
            <Reveal delay={120}>
              {invitee ? (
                <RsvpForm locale={locale} invitee={invitee} previous={previous} />
              ) : (
                <div className="rsvp-notice">
                  <h3>{text.rsvpNoticeTitle}</h3>
                  <p>{text.rsvpNoticeBody}</p>
                  <p className="rsvp-notice-help">{text.rsvpNoticeHelp}</p>
                </div>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <img className="footer-mark" src="/logo-juli-tomi-cropped.svg" alt="" aria-hidden="true" />
          <strong className="footer-names">{text.brand}</strong>
          <span className="footer-date">{text.date}</span>
          <p className="footer-thanks">{text.footerThanks}</p>
          <a className="footer-back" href="#top">
            {text.footerBack}
          </a>
        </div>
      </footer>
    </>
  );
}
