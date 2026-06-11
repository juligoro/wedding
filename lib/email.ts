import { Resend } from "resend";

import type { Invitee, Rsvp } from "@prisma/client";

import { buildGoogleCalendarUrl, getEventDateShort, getEventWhen } from "@/lib/calendar";
import type { Locale } from "@/lib/types";
import { getMapUrl } from "@/lib/venue";

interface EmailCopy {
  subject: string;
  subjectUpdated: string;
  greeting: (name: string) => string;
  confirmed: string;
  confirmedUpdated: string;
  detailsTitle: string;
  when: string;
  where: string;
  whereValue: string;
  addressSoon: string;
  calendarTitle: string;
  calendarIntro: string;
  calGoogle: string;
  calApple: string;
  editLead: string;
  editLinkLabel: string;
  faqLead: string;
  faqLinkLabel: string;
  closing: string;
  signature: string;
  banner: string;
  footer: string;
}

// Canonical event copy — mirrors the landing page (components/WeddingLanding.js).
// Edit these (and EVENT_ADDRESS in your env) to update what guests receive.
const EVENT: Record<Locale, EmailCopy> = {
  es: {
    subject: "¡Confirmamos tu lugar! · Juli & Tomi",
    subjectUpdated: "Actualizamos tu confirmación · Juli & Tomi",
    greeting: (name) => `¡Hola ${name}!`,
    confirmed: "Recibimos tu confirmación. ¡Nos hace muy felices que vengas a celebrar con nosotros!",
    confirmedUpdated:
      "Recibimos los cambios en tu confirmación. ¡Nos hace muy felices que vengas a celebrar con nosotros!",
    detailsTitle: "Los detalles",
    when: "Cuándo",
    where: "Dónde",
    whereValue: "Janos Quinta",
    addressSoon: "Te enviaremos la dirección exacta y cómo llegar muy pronto.",
    calendarTitle: "Agendá la fecha",
    calendarIntro: "Sumá el evento a tu calendario y recibí los recordatorios automáticamente.",
    calGoogle: "Agregar a Google Calendar",
    calApple: "Apple · Outlook (.ics)",
    editLead: "¿Necesitás editar tu respuesta?",
    editLinkLabel: "Hacelo desde tu link hasta el 31 de octubre",
    faqLead: "¿Dudas sobre el micro, el estacionamiento o el dresscode?",
    faqLinkLabel: "Mirá las preguntas frecuentes",
    closing: "Cualquier duda, respondé este correo.",
    signature: "Con cariño, Juli & Tomi",
    banner: "¡Nos vemos para celebrar!",
    footer: "Recibís este correo porque confirmaste tu asistencia en juli-tomi.wedding",
  },
  en: {
    subject: "Your spot is confirmed! · Juli & Tomi",
    subjectUpdated: "Your RSVP was updated · Juli & Tomi",
    greeting: (name) => `Hi ${name}!`,
    confirmed: "We got your RSVP. We're so happy you'll be celebrating with us!",
    confirmedUpdated:
      "We got the changes to your RSVP. We're so happy you'll be celebrating with us!",
    detailsTitle: "The details",
    when: "When",
    where: "Where",
    whereValue: "Janos Quinta",
    addressSoon: "We'll send the exact address and directions very soon.",
    calendarTitle: "Save the date",
    calendarIntro: "Add the event to your calendar and get reminders automatically.",
    calGoogle: "Add to Google Calendar",
    calApple: "Apple · Outlook (.ics)",
    editLead: "Need to edit your reply?",
    editLinkLabel: "You can do it from your link until October 31",
    faqLead: "Questions about the shuttle, parking or dress code?",
    faqLinkLabel: "Read the FAQ",
    closing: "Any questions, just reply to this email.",
    signature: "With love, Juli & Tomi",
    banner: "See you there to celebrate!",
    footer: "You're receiving this because you confirmed your attendance at juli-tomi.wedding",
  },
};

interface ReminderCopy {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  deadline: string;
  button: string;
  closing: string;
  signature: string;
  banner: string;
  footer: string;
}

const REMINDER: Record<string, ReminderCopy> = {
  es: {
    subject: "¿Nos acompañás? Confirmá tu asistencia · Juli & Tomi",
    greeting: (name) => `¡Hola ${name}!`,
    intro:
      "Todavía no recibimos tu confirmación y nos encantaría saber si nos acompañás en nuestro casamiento.",
    deadline: "Podés confirmar hasta el 31 de octubre desde tu link personalizado:",
    button: "Confirmar asistencia",
    closing: "Cualquier duda, respondé este correo.",
    signature: "Con cariño, Juli & Tomi",
    banner: "¡Nos vemos para celebrar!",
    footer: "Recibís este correo porque estás en la lista de invitados de juli-tomi.wedding",
  },
  // Multi-person household: the reader is one person, but the RSVP is the group's.
  "es-plural": {
    subject: "¿Nos acompañan? Confirmen su asistencia · Juli & Tomi",
    greeting: (name) => `¡Hola ${name}!`,
    intro:
      "Todavía no recibimos la confirmación de tu grupo y nos encantaría saber si nos acompañan en nuestro casamiento.",
    deadline: "Pueden confirmar hasta el 31 de octubre desde su link personalizado:",
    button: "Confirmar asistencia",
    closing: "Cualquier duda, respondé este correo.",
    signature: "Con cariño, Juli & Tomi",
    banner: "¡Nos vemos para celebrar!",
    footer: "Recibís este correo porque estás en la lista de invitados de juli-tomi.wedding",
  },
  en: {
    subject: "Will you join us? Please RSVP · Juli & Tomi",
    greeting: (name) => `Hi ${name}!`,
    intro:
      "We haven't received your group's RSVP yet and we'd love to know if you can join us at our wedding.",
    deadline: "You can RSVP until October 31 using your personal link:",
    button: "RSVP now",
    closing: "Any questions, just reply to this email.",
    signature: "With love, Juli & Tomi",
    banner: "See you there to celebrate!",
    footer: "You're receiving this because you're on the guest list at juli-tomi.wedding",
  },
};

// Font stacks: the landing's web fonts first, with email-safe fallbacks for
// clients that strip the @import (Gmail, Outlook) so it still looks intentional.
const DISPLAY_FONT = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const BODY_FONT = "'Spectral', Georgia, 'Times New Roman', serif";
const LABEL_FONT = "'Jost', 'Helvetica Neue', Arial, sans-serif";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Shared scaffold (header with logo + date, body card, banner, footer) so the
// confirmation and reminder emails stay visually identical.
function renderEmailShell({
  lang,
  assetBase,
  bodyHtml,
  banner,
  footer,
}: {
  lang: Locale;
  assetBase: string;
  bodyHtml: string;
  banner: string;
  footer: string;
}): string {
  const logoSrc = assetBase ? `${assetBase.replace(/\/$/, "")}/email-logo.png` : "";
  const logoBlock = logoSrc
    ? `<img src="${logoSrc}" alt="Juli &amp; Tomi" width="158" style="display:block;margin:0 auto 16px;width:158px;max-width:58%;height:auto" />`
    : `<div style="font-family:${DISPLAY_FONT};font-size:30px;color:#40513c;margin-bottom:8px">Juli &amp; Tomi</div>`;

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <style>
      :root { color-scheme: light only; supported-color-schemes: light only; }
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Spectral:wght@300;400;500&family=Jost:wght@400;500&display=swap');
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f4f0;font-family:${BODY_FONT}">
    <center>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f4f0" style="background-color:#f5f4f0">
        <tr>
          <td align="center" style="padding:32px 18px 56px">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:600px;max-width:100%;background-color:#ffffff;border:1px solid #e6e4dd;border-radius:18px">
              <tr>
                <td align="center" bgcolor="#faf8f3" style="background-color:#faf8f3;padding:42px 24px 26px;border-bottom:1px solid #efece4;border-radius:18px 18px 0 0">
                  ${logoBlock}
                  <div style="font-family:${DISPLAY_FONT};font-size:24px;letter-spacing:.14em;color:#40513c">${getEventDateShort()}</div>
                </td>
              </tr>
              <tr>
                <td bgcolor="#ffffff" style="background-color:#ffffff;padding:16px 32px 30px">
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td align="center" bgcolor="#40513c" style="background-color:#40513c;padding:24px 24px;border-radius:0 0 18px 18px">
                  <div style="color:#9fb08f;font-size:16px;line-height:1;letter-spacing:.4em;margin:0 0 9px">&#10087;</div>
                  <div style="font-family:${DISPLAY_FONT};font-size:19px;letter-spacing:.06em;color:#f3efe4">${banner}</div>
                </td>
              </tr>
            </table>
            <p style="font-family:${LABEL_FONT};text-align:center;color:#9a958a;font-size:11px;letter-spacing:.04em;margin:18px 0 0">${footer}</p>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`;
}

export type ConfirmationVariant = "created" | "updated";

function buildEmail(
  t: EmailCopy,
  rsvp: Rsvp,
  baseUrl = "",
  greetingName?: string,
  variant: ConfirmationVariant = "created",
  faqUrl = "",
  editUrl = "",
): { subject: string; html: string; text: string } {
  const name = greetingName || rsvp.firstName;
  const mapUrl = getMapUrl();
  const whereDetail = `<a href="${escapeHtml(mapUrl)}" style="color:#40513c;text-decoration:underline">${escapeHtml(t.whereValue)}</a>`;
  const whereText = `${t.whereValue} — ${mapUrl}`;

  const locale: Locale = t === EVENT.en ? "en" : "es";
  const whenValue = getEventWhen(locale);
  const googleUrl = buildGoogleCalendarUrl(locale);
  const icsUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/api/calendar?locale=${locale}` : "";
  const subject = variant === "updated" ? t.subjectUpdated : t.subject;
  const confirmed = variant === "updated" ? t.confirmedUpdated : t.confirmed;

  // Secondary info: small, muted lines under the details table.
  const calLink = (href: string, label: string) =>
    `<a href="${escapeHtml(href)}" style="font-family:${LABEL_FONT};font-size:11px;text-decoration:underline;color:#6f7166">${escapeHtml(label)}</a>`;

  const calendarBlock = `
                  <p style="margin:20px 0 0;font-size:12px;line-height:1.7;color:#9a958a">${escapeHtml(t.calendarTitle)}:
                    ${calLink(googleUrl, "Google Calendar")}${icsUrl ? ` · ${calLink(icsUrl, t.calApple)}` : ""}</p>`;

  const editBlock = editUrl
    ? `
                  <p style="margin:8px 0 0;font-size:12px;line-height:1.7;color:#9a958a">${escapeHtml(t.editLead)}
                    ${calLink(editUrl, t.editLinkLabel)}</p>`
    : "";

  const faqBlock = faqUrl
    ? `
                  <p style="margin:8px 0 0;font-size:12px;line-height:1.7;color:#9a958a">${escapeHtml(t.faqLead)}
                    ${calLink(faqUrl, t.faqLinkLabel)}</p>`
    : "";

  const row = (label: string, value: string) =>
    `<tr>
       <td style="font-family:${LABEL_FONT};padding:12px 0;border-bottom:1px solid #e6e4dd;vertical-align:top;width:118px;color:#6f8062;font-size:11px;letter-spacing:.16em;text-transform:uppercase">${label}</td>
       <td style="font-family:${BODY_FONT};padding:12px 0;border-bottom:1px solid #e6e4dd;color:#26241f;font-size:15px;line-height:1.6">${value}</td>
     </tr>`;

  const bodyHtml = `
                  <h1 style="font-family:${DISPLAY_FONT};font-weight:600;margin:14px 0 14px;font-size:30px;color:#26241f">${escapeHtml(t.greeting(name))}</h1>
                  <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#3a382f">${confirmed}</p>
                  <p style="font-family:${LABEL_FONT};margin:26px 0 10px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#6f8062">${t.detailsTitle}</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
                    ${row(t.when, whenValue)}
                    ${row(t.where, whereDetail)}
                  </table>
                  ${calendarBlock}${editBlock}${faqBlock}
                  <p style="margin:28px 0 0;font-size:15px;line-height:1.7;color:#3a382f">${t.closing}</p>
                  <p style="font-family:${DISPLAY_FONT};margin:14px 0 0;font-size:22px;color:#40513c">${t.signature}</p>`;

  const html = renderEmailShell({
    lang: locale,
    assetBase: baseUrl,
    bodyHtml,
    banner: t.banner,
    footer: t.footer,
  });

  const textLines = [
    t.greeting(name),
    "",
    confirmed,
    "",
    `${t.detailsTitle}:`,
    `- ${t.when}: ${whenValue}`,
    `- ${t.where}: ${whereText}`,
    "",
    `${t.calendarTitle}: ${t.calendarIntro}`,
    `- Google Calendar: ${googleUrl}`,
    icsUrl ? `- Apple / Outlook (.ics): ${icsUrl}` : "",
    editUrl ? `\n${t.editLead} ${t.editLinkLabel}: ${editUrl}` : "",
    faqUrl ? `\n${t.faqLead} ${t.faqLinkLabel}: ${faqUrl}` : "",
    "",
    t.closing,
    t.signature,
    "",
    t.banner,
  ];

  return { subject, html, text: textLines.filter((line) => line !== undefined).join("\n") };
}

// Best-effort: sends a confirmation email to the guest after a "sí" RSVP.
// No-ops (with a warning) if the env isn't configured, so RSVPs never break.
export async function sendRsvpConfirmation({
  rsvp,
  locale = "es",
  baseUrl = "",
  to,
  greetingName,
  variant = "created",
  faqUrl = "",
  editUrl = "",
}: {
  rsvp: Rsvp;
  locale?: string;
  baseUrl?: string;
  /** Override the recipient (per-person invite mode). Defaults to rsvp.email. */
  to?: string;
  /** Override the greeting name (per-person invite mode). Defaults to rsvp.firstName. */
  greetingName?: string;
  /** "updated" adjusts the subject and intro when a guest edits their RSVP. */
  variant?: ConfirmationVariant;
  /** Absolute URL to the FAQ page; included as a small link when set. */
  faqUrl?: string;
  /** Absolute URL to edit the RSVP (personal invite link); included when set. */
  editUrl?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn("RSVP email skipped: RESEND_API_KEY or EMAIL_FROM not set.");
    return;
  }

  const recipient = (to || rsvp.email || "").trim();

  if (!recipient) {
    return;
  }

  const key: Locale = locale === "en" ? "en" : "es";
  const t = EVENT[key];
  const assetBase = process.env.EMAIL_ASSET_BASE_URL || baseUrl;
  const { subject, html, text } = buildEmail(
    t,
    rsvp,
    assetBase,
    greetingName,
    variant,
    faqUrl,
    editUrl,
  );
  const resend = new Resend(apiKey);
  const replyTo = (process.env.EMAIL_REPLY_TO || "").trim();

  await resend.emails.send({
    from,
    to: recipient,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
}

export interface ReminderEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// RSVP reminder for a pending household, sent manually from the admin.
// Returns null when the invitee has no email.
export function buildRsvpReminderEmail(invitee: Invitee, baseUrl = ""): ReminderEmailPayload | null {
  const to = (invitee.email || "").trim();

  if (!to) {
    return null;
  }

  const locale: Locale = invitee.locale === "en" ? "en" : "es";
  const t = REMINDER[locale === "es" && invitee.party > 1 ? "es-plural" : locale];
  const name = invitee.greeting || invitee.fullName;
  const inviteUrl = `${(process.env.EMAIL_ASSET_BASE_URL || baseUrl).replace(/\/$/, "")}/i/${invitee.token}`;

  const bodyHtml = `
                  <h1 style="font-family:${DISPLAY_FONT};font-weight:600;margin:14px 0 14px;font-size:30px;color:#26241f">${escapeHtml(t.greeting(name))}</h1>
                  <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#3a382f">${escapeHtml(t.intro)}</p>
                  <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#3a382f">${escapeHtml(t.deadline)}</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px">
                    <tr>
                      <td align="center" bgcolor="#40513c" style="background-color:#40513c;border-radius:999px">
                        <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:13px 30px;font-family:${LABEL_FONT};font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#f3efe4;text-decoration:none">${escapeHtml(t.button)}</a>
                      </td>
                    </tr>
                  </table>
                  <p style="text-align:center;margin:10px 0 0;font-size:12px;line-height:1.6;color:#9a958a"><a href="${escapeHtml(inviteUrl)}" style="color:#6f8062;text-decoration:underline">${escapeHtml(inviteUrl)}</a></p>
                  <p style="margin:28px 0 0;font-size:15px;line-height:1.7;color:#3a382f">${escapeHtml(t.closing)}</p>
                  <p style="font-family:${DISPLAY_FONT};margin:14px 0 0;font-size:22px;color:#40513c">${escapeHtml(t.signature)}</p>`;

  const html = renderEmailShell({
    lang: locale,
    assetBase: process.env.EMAIL_ASSET_BASE_URL || baseUrl,
    bodyHtml,
    banner: t.banner,
    footer: t.footer,
  });

  const text = [
    t.greeting(name),
    "",
    t.intro,
    t.deadline,
    inviteUrl,
    "",
    t.closing,
    t.signature,
    "",
    t.banner,
  ].join("\n");

  return { to, subject: t.subject, html, text };
}
