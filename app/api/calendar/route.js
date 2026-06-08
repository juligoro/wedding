import { buildIcs } from "@/lib/calendar";

// Serves the wedding event as a downloadable .ics file (Apple Calendar, Outlook,
// and any standards-compliant client). Public on purpose — linked from the
// confirmation email and the RSVP success screen. ?locale=en for English copy.
export function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") === "en" ? "en" : "es";
  const ics = buildIcs(locale);

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="juli-tomi-2026.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
