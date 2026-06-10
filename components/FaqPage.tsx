import FaqSection from "@/components/FaqSection";
import { Sprig } from "@/components/Botanical";
import type { Locale } from "@/lib/types";

const copy: Record<Locale, { kicker: string; title: string; back: string }> = {
  es: {
    kicker: "Juli & Tomi",
    title: "Preguntas frecuentes",
    back: "Volver a la invitación",
  },
  en: {
    kicker: "Juli & Tomi",
    title: "FAQ",
    back: "Back to the invitation",
  },
};

export default function FaqPage({
  locale = "es",
  backHref = "/",
  showVenueLinks = false,
}: {
  locale?: Locale;
  backHref?: string;
  showVenueLinks?: boolean;
}) {
  const t = copy[locale] || copy.es;

  return (
    <main className="page faq-page" id="top">
      <section className="section" aria-label={t.title}>
        <Sprig className="hero-sprig left" />
        <Sprig className="hero-sprig right" flip />
        <div className="wrap">
          <div className="faq-head">
            <img className="monogram" src="/logo-juli-tomi-cropped.svg" alt="Juli & Tomi" />
            <h1 className="faq-title">{t.title}</h1>
          </div>
          <FaqSection locale={locale} showVenueLinks={showVenueLinks} />
          <p className="faq-back">
            <a className="button secondary" href={backHref}>
              {t.back}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
