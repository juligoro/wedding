import { normalizeName } from "@/lib/guests";

import type {
  InviteeStatus,
  MatchConfidence,
  ReconcileItem,
  ReconcileResult,
  Row,
  SerializedInvitee,
} from "../types";

function tokenKey(normalized: string): string {
  return normalized.split(" ").filter(Boolean).sort().join(" ");
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

interface GuestIndexes {
  byId: Map<number, Row>;
  byInviteeId: Map<number, Row[]>;
  byExact: Map<string, Row[]>;
  byTokens: Map<string, Row[]>;
  byEmail: Map<string, Row[]>;
}

function pushTo(map: Map<string, Row[]>, key: string, row: Row): void {
  const list = map.get(key);

  if (list) {
    list.push(row);
  } else {
    map.set(key, [row]);
  }
}

function buildGuestIndexes(rows: Row[]): GuestIndexes {
  const byId = new Map<number, Row>();
  const byInviteeId = new Map<number, Row[]>();
  const byExact = new Map<string, Row[]>();
  const byTokens = new Map<string, Row[]>();
  const byEmail = new Map<string, Row[]>();

  rows.forEach((row) => {
    byId.set(row.id, row);

    const normalized = normalizeName(row.name);
    const tokens = tokenKey(normalized);
    const email = normalizeEmail(row.email);

    if (row.inviteeId != null) {
      const list = byInviteeId.get(row.inviteeId);

      if (list) {
        list.push(row);
      } else {
        byInviteeId.set(row.inviteeId, [row]);
      }
    }

    if (normalized) {
      pushTo(byExact, normalized, row);
    }

    if (tokens) {
      pushTo(byTokens, tokens, row);
    }

    if (email) {
      pushTo(byEmail, email, row);
    }
  });

  return { byId, byInviteeId, byExact, byTokens, byEmail };
}

function statusFor(guest: Row | null): InviteeStatus {
  if (!guest) {
    return "pending";
  }

  return guest.attending ? "accepted" : "declined";
}

// Matches each invitee against the live RSVP rows (titulars + companions).
// Priority: manual link > exact name > sorted-token name > email > partial token subset.
export function reconcile(invitees: SerializedInvitee[], rows: Row[]): ReconcileResult {
  const { byId, byInviteeId, byExact, byTokens, byEmail } = buildGuestIndexes(rows);
  const matchedGuestIds = new Set<number>();

  const items: ReconcileItem[] = invitees.map((invitee) => {
    const normalized = invitee.normalized || normalizeName(invitee.fullName);
    const tokens = tokenKey(normalized);
    const email = normalizeEmail(invitee.email);

    let guest: Row | null = null;
    let confidence: MatchConfidence = "none";

    const linkedRows = byInviteeId.get(invitee.id);
    const exactMatches = normalized ? byExact.get(normalized) : undefined;
    const tokenMatches = tokens ? byTokens.get(tokens) : undefined;
    const emailMatches = email ? byEmail.get(email) : undefined;

    if (linkedRows && linkedRows.length > 0) {
      // Exact link via the personalized invite token. Prefer an attending row so
      // a mixed household reads as "Confirmó". Mark the whole household matched.
      guest = linkedRows.find((row) => row.attending) ?? linkedRows[0];
      confidence = "link";
      linkedRows.forEach((row) => matchedGuestIds.add(row.id));
    } else if (invitee.manualGuestId && byId.has(invitee.manualGuestId)) {
      guest = byId.get(invitee.manualGuestId) ?? null;
      confidence = "manual";
    } else if (exactMatches && exactMatches.length === 1) {
      guest = exactMatches[0];
      confidence = "exact";
    } else if (tokenMatches && tokenMatches.length === 1) {
      guest = tokenMatches[0];
      confidence = "tokens";
    } else if (emailMatches && emailMatches.length === 1) {
      guest = emailMatches[0];
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

export const CONFIDENCE_LABELS: Record<MatchConfidence, string> = {
  link: "Por link",
  manual: "Manual",
  exact: "Exacta",
  tokens: "Por nombre",
  email: "Por email",
  partial: "Aproximada",
  none: "—",
};
