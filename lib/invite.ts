import { randomBytes } from "crypto";

import type { InviteeMember, Locale } from "@/lib/types";

// Unguessable, URL-safe token for a household invite link (~12 chars).
// Server-only (uses node:crypto); called from the importer.
export function generateInviteToken(): string {
  return randomBytes(9).toString("base64url");
}

// Generate a token guaranteed not to collide with a set of taken tokens.
export function generateUniqueToken(taken: Set<string>): string {
  let token = generateInviteToken();

  while (taken.has(token)) {
    token = generateInviteToken();
  }

  taken.add(token);

  return token;
}

// Accepts whatever the spreadsheet has in the "Idioma" column.
export function parseLocale(value: string): Locale {
  const v = value.trim().toLowerCase();

  if (v.startsWith("en") || v.startsWith("ing")) {
    return "en";
  }

  return "es";
}

// "Lorena" → "Lorena"; "Lorena","Pablo" → "Lorena y Pablo" (es) / "Lorena and Pablo" (en);
// three or more → "A, B y C".
export function joinNames(names: string[], locale: Locale = "es"): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);

  if (clean.length <= 1) {
    return clean[0] ?? "";
  }

  const connector = locale === "en" ? "and" : "y";
  const head = clean.slice(0, -1).join(", ");

  return `${head} ${connector} ${clean[clean.length - 1]}`;
}

export function memberFullName(member: InviteeMember): string {
  return `${member.firstName} ${member.lastName}`.trim();
}
