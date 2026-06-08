import type { Rsvp } from "@prisma/client";

import type { CompanionFood, GuestSeed, InviteRsvpMember } from "@/lib/types";

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function normalizeName(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = name, ...lastNameParts] = name.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
}

// Per-person guests from a personalized-link submission. Unlike the open form,
// each member carries its own `attending` flag (and meal), so we build the
// guest rows directly from the members list instead of from the RSVP aggregate.
export function buildGuestsFromMembers(
  members: InviteRsvpMember[],
  contact: { email: string; whatsapp: string; allergies: string | null; needsBus: boolean | null },
): GuestSeed[] {
  return members.map((member, index): GuestSeed => {
    const lastName = member.lastName.trim();

    return {
      firstName: member.firstName.trim(),
      lastName: lastName || null,
      fullName: `${member.firstName} ${lastName}`.trim(),
      role: index === 0 ? "Titular" : "Acompañante",
      attending: member.attending,
      food: member.attending ? member.food || "Ninguna" : null,
      allergies: member.attending ? contact.allergies : null,
      needsBus: member.attending ? contact.needsBus : null,
      email: contact.email,
      whatsapp: contact.whatsapp,
    };
  });
}

export function buildGuestsFromRsvp(rsvp: Rsvp): GuestSeed[] {
  if (!rsvp.attending) {
    return [
      {
        firstName: rsvp.firstName,
        lastName: rsvp.lastName,
        fullName: `${rsvp.firstName} ${rsvp.lastName}`,
        role: "Titular",
        attending: false,
        food: null,
        allergies: null,
        needsBus: null,
        email: rsvp.email,
        whatsapp: rsvp.whatsapp,
      },
    ];
  }

  const companions = parseJson<string[]>(rsvp.companions, []);
  const companionFood = parseJson<CompanionFood[]>(rsvp.companionFood, []);

  return [
    {
      firstName: rsvp.firstName,
      lastName: rsvp.lastName,
      fullName: `${rsvp.firstName} ${rsvp.lastName}`,
      role: "Titular",
      attending: true,
      food: rsvp.primaryFood || "Ninguna",
      allergies: rsvp.allergies || null,
      needsBus: rsvp.needsBus,
      email: rsvp.email,
      whatsapp: rsvp.whatsapp,
    },
    ...companions.map((name, index) => {
      const parsedName = splitName(name);

      return {
        firstName: parsedName.firstName,
        lastName: parsedName.lastName || null,
        fullName: name,
        role: "Acompañante" as const,
        attending: true,
        food: companionFood[index]?.restriction || "Ninguna",
        allergies: rsvp.allergies || null,
        needsBus: rsvp.needsBus,
        email: rsvp.email,
        whatsapp: rsvp.whatsapp,
      };
    }),
  ];
}
