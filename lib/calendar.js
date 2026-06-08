// Single source of truth for "add to calendar" across the site + emails.
// Pure module (no Node APIs) so it's safe to import in client and server.
//
// Event: Sunday, December 6, 2026, 14:00 ART (UTC-3) at Janos Quinta.
// Argentina has no DST (fixed -03:00), so we express times in UTC (Z) to avoid
// shipping a VTIMEZONE block — universally correct across calendar clients.

const START_UTC = "20261206T170000Z"; // 14:00 ART
const END_UTC = "20261207T050000Z"; // 02:00 ART (next day)
const DTSTAMP = "20260608T000000Z"; // fixed creation stamp (stable UID/object)
const UID = "juli-tomi-wedding-2026@juli-tomi.wedding";

const SITE_URL = "https://juli-tomi.wedding";
const LOCATION =
  "Janos Quinta, Av. Pres. Arturo Umberto Illia 12802-12900, B1669 Del Viso, Provincia de Buenos Aires";

// Reminders fired automatically by the guest's calendar (Apple/Outlook honor these).
const ALARM_TRIGGERS = ["-P30D", "-P7D", "-PT24H"];

const CALENDAR_COPY = {
  es: {
    title: "Casamiento de Juli & Tomi",
    description:
      "¡Nos vemos para celebrar! Te esperamos en Janos Quinta desde las 14 hs. Más info y cómo llegar: " +
      SITE_URL,
  },
  en: {
    title: "Juli & Tomi's Wedding",
    description:
      "See you there to celebrate! We're expecting you at Janos Quinta from 2:00 PM. More info and directions: " +
      SITE_URL,
  },
};

function getCopy(locale) {
  return CALENDAR_COPY[locale] || CALENDAR_COPY.es;
}

// Google Calendar "add event" template URL (Google ignores .ics alarms, so guests
// add their own reminders — but the event lands fully pre-filled).
export function buildGoogleCalendarUrl(locale = "es") {
  const copy = getCopy(locale);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: copy.title,
    dates: `${START_UTC}/${END_UTC}`,
    details: copy.description,
    location: LOCATION,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Escapes a TEXT value per RFC 5545 (backslash, comma, semicolon, newline).
function escapeIcsText(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");
}

// Folds a content line to <=75 octets with CRLF + single space, per RFC 5545.
function foldLine(line) {
  if (line.length <= 75) {
    return line;
  }

  const chunks = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);

  while (rest.length > 74) {
    chunks.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }

  if (rest.length > 0) {
    chunks.push(" " + rest);
  }

  return chunks.join("\r\n");
}

// Builds a complete VCALENDAR string with VALARM reminders.
export function buildIcs(locale = "es") {
  const copy = getCopy(locale);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Juli & Tomi//Wedding//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${UID}`,
    `DTSTAMP:${DTSTAMP}`,
    `DTSTART:${START_UTC}`,
    `DTEND:${END_UTC}`,
    `SUMMARY:${escapeIcsText(copy.title)}`,
    `DESCRIPTION:${escapeIcsText(copy.description)}`,
    `LOCATION:${escapeIcsText(LOCATION)}`,
    `URL:${SITE_URL}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
  ];

  for (const trigger of ALARM_TRIGGERS) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(copy.title)}`,
      `TRIGGER:${trigger}`,
      "END:VALARM",
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
