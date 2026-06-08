import { Resend } from "resend";

import type { Rsvp } from "@prisma/client";

import { buildGoogleCalendarUrl, getEventDateShort, getEventWhen } from "@/lib/calendar";
import { parseJson } from "@/lib/guests";
import type { Locale } from "@/lib/types";

interface EmailCopy {
  subject: string;
  greeting: (name: string) => string;
  confirmed: string;
  partyIntro: string;
  detailsTitle: string;
  when: string;
  where: string;
  whereValue: string;
  addressSoon: string;
  dress: string;
  dressValue: string;
  calendarTitle: string;
  calendarIntro: string;
  calGoogle: string;
  calApple: string;
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
    greeting: (name) => `¡Hola ${name}!`,
    confirmed: "Recibimos tu confirmación. ¡Nos hace muy felices que vengas a celebrar con nosotros!",
    partyIntro: "Te esperamos a:",
    detailsTitle: "Los detalles",
    when: "Cuándo",
    where: "Dónde",
    whereValue: "Janos Quinta",
    addressSoon: "Te enviaremos la dirección exacta y cómo llegar muy pronto.",
    dress: "Dresscode",
    dressValue:
      "La ceremonia es al aire libre y va a hacer calor: elegante pero fresco. Dejemos el blanco para la novia.",
    calendarTitle: "Agendá la fecha",
    calendarIntro: "Sumá el evento a tu calendario y recibí los recordatorios automáticamente.",
    calGoogle: "Agregar a Google Calendar",
    calApple: "Apple · Outlook (.ics)",
    closing: "Cualquier duda, respondé este correo.",
    signature: "Con cariño, Juli & Tomi",
    banner: "¡Nos vemos para celebrar!",
    footer: "Recibís este correo porque confirmaste tu asistencia en juli-tomi.wedding",
  },
  en: {
    subject: "Your spot is confirmed! · Juli & Tomi",
    greeting: (name) => `Hi ${name}!`,
    confirmed: "We got your RSVP. We're so happy you'll be celebrating with us!",
    partyIntro: "We're expecting:",
    detailsTitle: "The details",
    when: "When",
    where: "Where",
    whereValue: "Janos Quinta",
    addressSoon: "We'll send the exact address and directions very soon.",
    dress: "Dress code",
    dressValue:
      "The ceremony is outdoors and the weather will be warm: elegant but fresh. White is reserved for the bride.",
    calendarTitle: "Save the date",
    calendarIntro: "Add the event to your calendar and get reminders automatically.",
    calGoogle: "Add to Google Calendar",
    calApple: "Apple · Outlook (.ics)",
    closing: "Any questions, just reply to this email.",
    signature: "With love, Juli & Tomi",
    banner: "See you there to celebrate!",
    footer: "You're receiving this because you confirmed your attendance at juli-tomi.wedding",
  },
};

// Font stacks: the landing's web fonts first, with email-safe fallbacks for
// clients that strip the @import (Gmail, Outlook) so it still looks intentional.
const DISPLAY_FONT = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const BODY_FONT = "'Spectral', Georgia, 'Times New Roman', serif";
const LABEL_FONT = "'Jost', 'Helvetica Neue', Arial, sans-serif";

// Google Maps link for the venue (override with EVENT_MAP_URL in your env).
const DEFAULT_MAP_URL =
  "https://www.google.com/maps?q=Janos+Quinta,+Av.+Pres.+Arturo+Umberto+Illia+12802-12900,+B1669+Del+Viso,+Provincia+de+Buenos+Aires&ftid=0x95bc993b005e22c9:0xb3cf995bc6679d2c&entry=gps&shh=CAE&lucs=,94297699,94231188,94280568,47071704,94218641,94282134,100813464,94286869&g_ep=CAISEjI2LjIyLjIuOTIxMTAxNzU3MBgAIIgnKkksOTQyOTc2OTksOTQyMzExODgsOTQyODA1NjgsNDcwNzE3MDQsOTQyMTg2NDEsOTQyODIxMzQsMTAwODEzNDY0LDk0Mjg2ODY5QgJBUg%3D%3D&skid=df8b08af-b870-4b0a-82ee-56f71f9299ee&g_st=ia";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildEmail(
  t: EmailCopy,
  rsvp: Rsvp,
  baseUrl = "",
  greetingName?: string,
): { subject: string; html: string; text: string } {
  const name = greetingName || rsvp.firstName;
  const companions = parseJson<string[]>(rsvp.companions, []);
  const partyNames = [`${rsvp.firstName} ${rsvp.lastName}`.trim(), ...companions].filter(Boolean);
  const mapUrl = (process.env.EVENT_MAP_URL || DEFAULT_MAP_URL).trim();
  const whereDetail = `<a href="${escapeHtml(mapUrl)}" style="color:#40513c;text-decoration:underline">${escapeHtml(t.whereValue)}</a>`;
  const whereText = `${t.whereValue} — ${mapUrl}`;
  const logoSrc = baseUrl ? `${baseUrl.replace(/\/$/, "")}/email-logo.png` : "";

  const logoBlock = logoSrc
    ? `<img src="${logoSrc}" alt="Juli &amp; Tomi" width="158" style="display:block;margin:0 auto 16px;width:158px;max-width:58%;height:auto" />`
    : `<div style="font-family:${DISPLAY_FONT};font-size:30px;color:#40513c;margin-bottom:8px">Juli &amp; Tomi</div>`;

  const partyBlock =
    partyNames.length > 1
      ? `<p style="font-family:${LABEL_FONT};margin:0 0 6px;color:#6f8062;font-size:12px;letter-spacing:.18em;text-transform:uppercase">${t.partyIntro}</p>
         <p style="font-family:${BODY_FONT};margin:0 0 4px;font-size:16px;color:#26241f">${partyNames
           .map((person) => escapeHtml(person))
           .join(" · ")}</p>`
      : "";

  const locale: Locale = t === EVENT.en ? "en" : "es";
  const whenValue = getEventWhen(locale);
  const googleUrl = buildGoogleCalendarUrl(locale);
  const icsUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/api/calendar?locale=${locale}` : "";

  const calLink = (href: string, label: string) =>
    `<a href="${escapeHtml(href)}" style="font-family:${LABEL_FONT};font-size:12px;text-decoration:underline;color:#40513c">${escapeHtml(label)}</a>`;

  const calendarBlock = `
                  <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#6f7166">${escapeHtml(t.calendarTitle)}:
                    ${calLink(googleUrl, "Google Calendar")}${icsUrl ? ` · ${calLink(icsUrl, t.calApple)}` : ""}</p>`;

  const row = (label: string, value: string) =>
    `<tr>
       <td style="font-family:${LABEL_FONT};padding:12px 0;border-bottom:1px solid #e6e4dd;vertical-align:top;width:118px;color:#6f8062;font-size:11px;letter-spacing:.16em;text-transform:uppercase">${label}</td>
       <td style="font-family:${BODY_FONT};padding:12px 0;border-bottom:1px solid #e6e4dd;color:#26241f;font-size:15px;line-height:1.6">${value}</td>
     </tr>`;

  const html = `<!doctype html>
<html lang="${t === EVENT.en ? "en" : "es"}">
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
                  <h1 style="font-family:${DISPLAY_FONT};font-weight:600;margin:14px 0 14px;font-size:30px;color:#26241f">${escapeHtml(t.greeting(name))}</h1>
                  <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#3a382f">${t.confirmed}</p>
                  ${partyBlock}
                  <p style="font-family:${LABEL_FONT};margin:26px 0 10px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#6f8062">${t.detailsTitle}</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
                    ${row(t.when, whenValue)}
                    ${row(t.where, whereDetail)}
                    ${row(t.dress, t.dressValue)}
                  </table>
                  ${calendarBlock}
                  <p style="margin:28px 0 0;font-size:15px;line-height:1.7;color:#3a382f">${t.closing}</p>
                  <p style="font-family:${DISPLAY_FONT};margin:14px 0 0;font-size:22px;color:#40513c">${t.signature}</p>
                </td>
              </tr>
              <tr>
                <td align="center" bgcolor="#40513c" style="background-color:#40513c;padding:24px 24px;border-radius:0 0 18px 18px">
                  <div style="color:#9fb08f;font-size:16px;line-height:1;letter-spacing:.4em;margin:0 0 9px">&#10087;</div>
                  <div style="font-family:${DISPLAY_FONT};font-size:19px;letter-spacing:.06em;color:#f3efe4">${t.banner}</div>
                </td>
              </tr>
            </table>
            <p style="font-family:${LABEL_FONT};text-align:center;color:#9a958a;font-size:11px;letter-spacing:.04em;margin:18px 0 0">${t.footer}</p>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`;

  const textLines = [
    t.greeting(name),
    "",
    t.confirmed,
    partyNames.length > 1 ? `\n${t.partyIntro} ${partyNames.join(" · ")}` : "",
    "",
    `${t.detailsTitle}:`,
    `- ${t.when}: ${whenValue}`,
    `- ${t.where}: ${whereText}`,
    `- ${t.dress}: ${t.dressValue}`,
    "",
    `${t.calendarTitle}: ${t.calendarIntro}`,
    `- Google Calendar: ${googleUrl}`,
    icsUrl ? `- Apple / Outlook (.ics): ${icsUrl}` : "",
    "",
    t.closing,
    t.signature,
    "",
    t.banner,
  ];

  return { subject: t.subject, html, text: textLines.filter((line) => line !== undefined).join("\n") };
}

// Best-effort: sends a confirmation email to the guest after a "sí" RSVP.
// No-ops (with a warning) if the env isn't configured, so RSVPs never break.
export async function sendRsvpConfirmation({
  rsvp,
  locale = "es",
  baseUrl = "",
  to,
  greetingName,
}: {
  rsvp: Rsvp;
  locale?: string;
  baseUrl?: string;
  /** Override the recipient (per-person invite mode). Defaults to rsvp.email. */
  to?: string;
  /** Override the greeting name (per-person invite mode). Defaults to rsvp.firstName. */
  greetingName?: string;
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
  const { subject, html, text } = buildEmail(t, rsvp, assetBase, greetingName);
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
