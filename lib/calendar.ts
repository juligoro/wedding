// Single source of truth for the event date/time across the site + emails.
// Pure module (no Node-only APIs) so it's safe to import in client and server.
//
// ════════════════════════════════════════════════════════════════════════
//  ⏰  EDIT ONLY THIS BLOCK IF THE DATE OR TIME CHANGES.
//  Times are LOCAL Argentina time (UTC-3, no daylight saving).
//  Keep the machine fields (date/start/end) and the human-readable strings
//  (when/timePhrase) in sync — the .ics, Google Calendar and the email all
//  derive from here. (The landing page has its own copy — update separately.)
// ════════════════════════════════════════════════════════════════════════
const EVENT = {
  date: { year: 2026, month: 12, day: 6 }, // month is 1-based (12 = December)
  start: { hour: 14, minute: 0 }, // 24h local time
  end: { hour: 23, minute: 0, dayOffset: 0 }, // ends ~23:00 the same day
  utcOffset: -3, // Argentina, fixed (no DST)

  // What guests read. Phrase these to match `date`/`start` above.
  when: {
    es: "Domingo 6 de diciembre de 2026 · desde las 14 hs.",
    en: "Sunday, December 6, 2026 · from 2:00 PM",
  },
  timePhrase: {
    es: "desde las 14 hs",
    en: "from 2:00 PM",
  },
};
// ════════════════════════════════════════════════════════════════════════

const DTSTAMP = "20260608T000000Z"; // fixed creation stamp (stable iCal object)
const UID = "juli-tomi-wedding-2026@juli-tomi.wedding";
const SITE_URL = "https://juli-tomi.wedding";
const LOCATION =
  "Janos Quinta, Av. Pres. Arturo Umberto Illia 12802-12900, B1669 Del Viso, Provincia de Buenos Aires";

// Reminders fired automatically by the guest's calendar (Apple/Outlook honor these).
const ALARM_TRIGGERS = ["-P30D", "-P7D", "-PT24H"];

type LocaleKey = "es" | "en";

interface LocalDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

// Converts a local Argentina date/time to an iCal UTC stamp (YYYYMMDDTHHMMSSZ).
// UTC = local - utcOffset; Date.UTC handles any hour/day rollover.
function toIcsUtc({ year, month, day, hour, minute }: LocalDateTime): string {
  const ms = Date.UTC(year, month - 1, day, hour - EVENT.utcOffset, minute, 0);
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");

  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(
    d.getUTCHours(),
  )}${p(d.getUTCMinutes())}00Z`;
}

const START_UTC = toIcsUtc({
  year: EVENT.date.year,
  month: EVENT.date.month,
  day: EVENT.date.day,
  hour: EVENT.start.hour,
  minute: EVENT.start.minute,
});

const END_UTC = toIcsUtc({
  year: EVENT.date.year,
  month: EVENT.date.month,
  day: EVENT.date.day + EVENT.end.dayOffset,
  hour: EVENT.end.hour,
  minute: EVENT.end.minute,
});

function pickLocale(locale: string): LocaleKey {
  return locale === "en" ? "en" : "es";
}

function getCopy(locale: string): { title: string; description: string } {
  const l = pickLocale(locale);
  const title = l === "en" ? "Juli & Tomi's Wedding" : "Casamiento de Juli & Tomi";
  const description =
    l === "en"
      ? `See you there to celebrate! We're expecting you at Janos Quinta ${EVENT.timePhrase.en}. More info and directions: ${SITE_URL}`
      : `¡Nos vemos para celebrar! Te esperamos en Janos Quinta ${EVENT.timePhrase.es}. Más info y cómo llegar: ${SITE_URL}`;

  return { title, description };
}

// Human-readable "when" line, e.g. "Domingo 6 de diciembre de 2026 · desde las 14 hs."
export function getEventWhen(locale: string = "es"): string {
  return EVENT.when[pickLocale(locale)];
}

// Short date for headers, e.g. "6 · 12 · 2026".
export function getEventDateShort(): string {
  const { year, month, day } = EVENT.date;

  return `${day} · ${month} · ${year}`;
}

// Google Calendar "add event" template URL (Google ignores .ics alarms, so guests
// add their own reminders — but the event lands fully pre-filled).
export function buildGoogleCalendarUrl(locale: string = "es"): string {
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
function escapeIcsText(value: unknown): string {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");
}

// Folds a content line to <=75 octets with CRLF + single space, per RFC 5545.
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }

  const chunks: string[] = [];
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
export function buildIcs(locale: string = "es"): string {
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
