import Reveal from "@/components/Reveal";
import { getMapUrl, getWazeUrl } from "@/lib/venue";

interface FaqItem {
  q: string;
  a: string[];
  links?: { label: string; href: string }[];
  // The exact venue location stays gated behind the invite link.
  venueOnly?: boolean;
}

const copy: Record<string, { items: FaqItem[] }> = {
  es: {
    items: [
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
        venueOnly: true,
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
          "El dresscode es elegante.",
          "La ceremonia es al aire libre, pero toda la fiesta es adentro.",
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
  },
  en: {
    items: [
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
        venueOnly: true,
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
          "The dress code is elegant.",
          "The ceremony is outdoors, but the whole party is indoors.",
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
  },
};

export default function FaqSection({
  locale = "es",
  showVenueLinks = false,
}: {
  locale?: string;
  showVenueLinks?: boolean;
}) {
  const items = (copy[locale] || copy.es).items.filter(
    (item) => !item.venueOnly || showVenueLinks,
  );

  return (
    <div className="faq-list">
      {items.map((item, i) => (
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
                    <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
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
  );
}
