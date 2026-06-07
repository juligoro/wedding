import { normalizeName } from "@/lib/guests";

function tokenKey(normalized) {
  return normalized.split(" ").filter(Boolean).sort().join(" ");
}

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function buildGuestIndexes(rows) {
  const byId = new Map();
  const byExact = new Map();
  const byTokens = new Map();
  const byEmail = new Map();

  rows.forEach((row) => {
    byId.set(row.id, row);

    const normalized = normalizeName(row.name);
    const tokens = tokenKey(normalized);
    const email = normalizeEmail(row.email);

    if (normalized) {
      (byExact.get(normalized) || byExact.set(normalized, []).get(normalized)).push(row);
    }

    if (tokens) {
      (byTokens.get(tokens) || byTokens.set(tokens, []).get(tokens)).push(row);
    }

    if (email) {
      (byEmail.get(email) || byEmail.set(email, []).get(email)).push(row);
    }
  });

  return { byId, byExact, byTokens, byEmail };
}

function statusFor(guest) {
  if (!guest) {
    return "pending";
  }

  return guest.attending ? "accepted" : "declined";
}

// Matches each invitee against the live RSVP rows (titulars + companions).
// Priority: manual link > exact name > sorted-token name > email > partial token subset.
export function reconcile(invitees, rows) {
  const { byId, byExact, byTokens, byEmail } = buildGuestIndexes(rows);
  const matchedGuestIds = new Set();

  const items = invitees.map((invitee) => {
    const normalized = invitee.normalized || normalizeName(invitee.fullName);
    const tokens = tokenKey(normalized);
    const email = normalizeEmail(invitee.email);

    let guest = null;
    let confidence = "none";

    if (invitee.manualGuestId && byId.has(invitee.manualGuestId)) {
      guest = byId.get(invitee.manualGuestId);
      confidence = "manual";
    } else if (normalized && byExact.get(normalized)?.length === 1) {
      [guest] = byExact.get(normalized);
      confidence = "exact";
    } else if (tokens && byTokens.get(tokens)?.length === 1) {
      [guest] = byTokens.get(tokens);
      confidence = "tokens";
    } else if (email && byEmail.get(email)?.length === 1) {
      [guest] = byEmail.get(email);
      confidence = "email";
    } else if (tokens) {
      const inviteeTokens = tokens.split(" ");
      const partial = rows.find((row) => {
        const rowTokens = tokenKey(normalizeName(row.name)).split(" ");

        return (
          inviteeTokens.length > 0 &&
          rowTokens.length > 0 &&
          inviteeTokens.every((token) => rowTokens.includes(token))
        );
      });

      if (partial) {
        guest = partial;
        confidence = "partial";
      }
    }

    if (guest) {
      matchedGuestIds.add(guest.id);
    }

    return {
      ...invitee,
      normalized,
      matchedGuest: guest,
      confidence,
      status: statusFor(guest),
    };
  });

  // Guests who responded but aren't on the uploaded list.
  const extras = rows.filter((row) => !matchedGuestIds.has(row.id));

  const stats = {
    total: items.length,
    accepted: items.filter((item) => item.status === "accepted").length,
    declined: items.filter((item) => item.status === "declined").length,
    pending: items.filter((item) => item.status === "pending").length,
    contacted: items.filter((item) => item.status === "pending" && item.contacted).length,
    extras: extras.length,
  };

  return { items, extras, stats };
}

export const CONFIDENCE_LABELS = {
  manual: "Manual",
  exact: "Exacta",
  tokens: "Por nombre",
  email: "Por email",
  partial: "Aproximada",
  none: "—",
};
