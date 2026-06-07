import { Resend } from "resend";

import { parseJson } from "@/lib/guests";

// Canonical event copy — mirrors the landing page (components/WeddingLanding.js).
// Edit these (and EVENT_ADDRESS in your env) to update what guests receive.
const EVENT = {
  es: {
    subject: "¡Confirmamos tu lugar! · Juli & Tomi",
    greeting: (name) => `¡Hola ${name}!`,
    confirmed: "Recibimos tu confirmación. ¡Nos hace muy felices que vengas a celebrar con nosotros!",
    partyIntro: "Te esperamos a:",
    detailsTitle: "Los detalles",
    when: "Cuándo",
    whenValue: "Domingo 6 de diciembre de 2026 · desde las 14 hs.",
    where: "Dónde",
    whereValue: "Del Viso, Buenos Aires",
    addressSoon: "Te enviaremos la dirección exacta y cómo llegar muy pronto.",
    dress: "Dresscode",
    dressValue:
      "La ceremonia es al aire libre y va a hacer calor: elegante pero fresco. Dejemos el blanco para la novia.",
    closing: "Cualquier duda, respondé este correo. ¡Nos vemos para celebrar!",
    signature: "Con cariño, Juli & Tomi",
    footer: "Recibís este correo porque confirmaste tu asistencia en juli-tomi.wedding",
  },
  en: {
    subject: "Your spot is confirmed! · Juli & Tomi",
    greeting: (name) => `Hi ${name}!`,
    confirmed: "We got your RSVP. We're so happy you'll be celebrating with us!",
    partyIntro: "We're expecting:",
    detailsTitle: "The details",
    when: "When",
    whenValue: "Sunday, December 6, 2026 · from 2:00 PM",
    where: "Where",
    whereValue: "Del Viso, Buenos Aires",
    addressSoon: "We'll send the exact address and directions very soon.",
    dress: "Dress code",
    dressValue:
      "The ceremony is outdoors and the weather will be warm: elegant but fresh. White is reserved for the bride.",
    closing: "Any questions, just reply to this email. See you there!",
    signature: "With love, Juli & Tomi",
    footer: "You're receiving this because you confirmed your attendance at juli-tomi.wedding",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildEmail(t, rsvp) {
  const name = rsvp.firstName;
  const companions = parseJson(rsvp.companions, []);
  const partyNames = [`${rsvp.firstName} ${rsvp.lastName}`.trim(), ...companions].filter(Boolean);
  const address = (process.env.EVENT_ADDRESS || "").trim();
  const whereDetail = address ? `${t.whereValue} · ${address}` : `${t.whereValue}. ${t.addressSoon}`;

  const partyBlock =
    partyNames.length > 1
      ? `<p style="margin:0 0 6px;color:#6f6a60;font-size:14px">${t.partyIntro}</p>
         <p style="margin:0 0 20px;font-size:16px;color:#26241f">${partyNames
           .map((person) => escapeHtml(person))
           .join(" · ")}</p>`
      : "";

  const row = (label, value) =>
    `<tr>
       <td style="padding:10px 0;border-bottom:1px solid #e6e4dd;vertical-align:top;width:120px;color:#6f8062;font-size:13px;letter-spacing:.04em;text-transform:uppercase">${label}</td>
       <td style="padding:10px 0;border-bottom:1px solid #e6e4dd;color:#26241f;font-size:15px;line-height:1.5">${value}</td>
     </tr>`;

  const html = `<!doctype html>
<html lang="${t === EVENT.en ? "en" : "es"}">
  <body style="margin:0;background:#f5f4f0;font-family:Georgia,'Times New Roman',serif">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px">
      <div style="background:#ffffff;border:1px solid #e6e4dd;border-radius:14px;overflow:hidden">
        <div style="background:#40513c;color:#f5f4f0;text-align:center;padding:34px 24px">
          <div style="font-size:13px;letter-spacing:.28em;text-transform:uppercase;opacity:.85">Juli &amp; Tomi</div>
          <div style="font-size:24px;margin-top:8px">6 · 12 · 2026</div>
        </div>
        <div style="padding:32px 28px">
          <h1 style="margin:0 0 14px;font-size:22px;color:#26241f">${escapeHtml(t.greeting(name))}</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#3a382f">${t.confirmed}</p>
          ${partyBlock}
          <p style="margin:24px 0 8px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#6f8062">${t.detailsTitle}</p>
          <table style="width:100%;border-collapse:collapse">
            ${row(t.when, t.whenValue)}
            ${row(t.where, whereDetail)}
            ${row(t.dress, t.dressValue)}
          </table>
          <p style="margin:26px 0 0;font-size:15px;line-height:1.6;color:#3a382f">${t.closing}</p>
          <p style="margin:18px 0 0;font-size:16px;color:#40513c">${t.signature}</p>
        </div>
      </div>
      <p style="text-align:center;color:#9a958a;font-size:12px;margin:18px 0 0">${t.footer}</p>
    </div>
  </body>
</html>`;

  const textLines = [
    t.greeting(name),
    "",
    t.confirmed,
    partyNames.length > 1 ? `\n${t.partyIntro} ${partyNames.join(" · ")}` : "",
    "",
    `${t.detailsTitle}:`,
    `- ${t.when}: ${t.whenValue}`,
    `- ${t.where}: ${whereDetail}`,
    `- ${t.dress}: ${t.dressValue}`,
    "",
    t.closing,
    t.signature,
  ];

  return { subject: t.subject, html, text: textLines.filter((line) => line !== undefined).join("\n") };
}

// Best-effort: sends a confirmation email to the guest after a "sí" RSVP.
// No-ops (with a warning) if the env isn't configured, so RSVPs never break.
export async function sendRsvpConfirmation({ rsvp, locale = "es" }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn("RSVP email skipped: RESEND_API_KEY or EMAIL_FROM not set.");
    return;
  }

  if (!rsvp.email) {
    return;
  }

  const t = EVENT[locale] || EVENT.es;
  const { subject, html, text } = buildEmail(t, rsvp);
  const resend = new Resend(apiKey);
  const replyTo = (process.env.EMAIL_REPLY_TO || "").trim();

  await resend.emails.send({
    from,
    to: rsvp.email,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
}
