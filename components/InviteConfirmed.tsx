import { Sprig } from "@/components/Botanical";
import { buildGoogleCalendarUrl, getEventWhen } from "@/lib/calendar";
import type { Locale } from "@/lib/types";

const copy: Record<Locale, {
  title: string;
  body: string;
  calTitle: string;
  google: string;
  apple: string;
  edit: string;
}> = {
  es: {
    title: "¡Ya confirmaste!",
    body: "Gracias por confirmar. Te esperamos para celebrar juntos este día tan especial.",
    calTitle: "Agendá la fecha",
    google: "Google Calendar",
    apple: "Apple · Outlook",
    edit: "Si necesitás editar algo de tu respuesta, escribinos y lo actualizamos.",
  },
  en: {
    title: "You're all set!",
    body: "Thanks for confirming. We can't wait to celebrate this special day with you.",
    calTitle: "Save the date",
    google: "Google Calendar",
    apple: "Apple · Outlook",
    edit: "If you need to change anything in your reply, just message us and we'll update it.",
  },
};

export default function InviteConfirmed({
  greeting,
  locale = "es",
}: {
  greeting: string;
  locale?: Locale;
}) {
  const text = copy[locale] || copy.es;
  const hello = locale === "en" ? `Hi ${greeting}` : `¡Hola ${greeting}!`;

  return (
    <main className="page invite-page" id="top">
      <section className="invite-confirmed" aria-label={text.title}>
        <div className="invite-bg" aria-hidden="true">
          <span className="hero-glow" />
          <span className="hero-grain" />
        </div>
        <Sprig className="hero-sprig left" />
        <Sprig className="hero-sprig right" flip />

        <div className="invite-card">
          <img className="monogram" src="/logo-juli-tomi-cropped.svg" alt="Juli & Tomi" />
          <p className="invite-hello">{hello}</p>
          <h1 className="invite-title">{text.title}</h1>
          <p className="invite-when">{getEventWhen(locale)}</p>
          <p className="invite-body">{text.body}</p>

          <div className="success-calendar">
            <span className="success-calendar-title">{text.calTitle}</span>
            <div className="success-calendar-actions">
              <a
                className="button calendar"
                href={buildGoogleCalendarUrl(locale)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {text.google}
              </a>
              <a className="button calendar" href={`/api/calendar?locale=${locale}`}>
                {text.apple}
              </a>
            </div>
          </div>

          <p className="invite-edit">{text.edit}</p>
        </div>
      </section>
    </main>
  );
}
