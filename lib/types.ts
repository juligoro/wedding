// Shared domain types used across the data layer, API routes and the UI.

export type Locale = "es" | "en";

// One companion's dietary restriction, as stored in Rsvp.companionFood (JSON).
export interface CompanionFood {
  name: string;
  restriction: string;
}

// One invited person within a household, as stored in Invitee.members (JSON).
// These are the names the couple uploads; they pre-fill the RSVP form.
export interface InviteeMember {
  firstName: string;
  lastName: string;
}

// The slice of an Invitee that the public invite page passes to the RSVP form.
export interface InviteeContext {
  token: string;
  greeting: string;
  locale: Locale;
  members: InviteeMember[];
  email: string;
  whatsapp: string;
}

// A guest row as derived from an RSVP, before it gets an `id`/`rsvpId`.
// Shape consumed by prisma.guest.createMany in the RSVP route.
export interface GuestSeed {
  firstName: string;
  lastName: string | null;
  fullName: string;
  role: "Titular" | "Acompañante";
  attending: boolean;
  food: string | null;
  allergies: string | null;
  needsBus: boolean | null;
  email: string; // Guest.email is non-nullable in the schema
  whatsapp: string; // Guest.whatsapp is non-nullable in the schema
}

// A household's prior answers, rebuilt from its live Guest rows so the RSVP
// form can be prefilled when a guest edits their response.
export interface InvitePreviousResponse {
  members: {
    firstName: string;
    lastName: string;
    attending: boolean;
    food: string;
    email: string;
    whatsapp: string;
    allergies: string;
  }[];
  needsBus: boolean | null;
  message: string;
}

// One member's reply within a personalized-link RSVP submission. Contact and
// allergies are per person so each attending guest gets their own confirmation
// email and can note their own dietary needs.
export interface InviteRsvpMember {
  firstName: string;
  lastName: string;
  attending: boolean;
  food: string;
  email: string;
  whatsapp: string;
  allergies: string;
}

// Payload posted by the personalized-link form (JSON, not FormData).
export interface InviteRsvpPayload {
  token: string;
  locale?: string;
  micro: string;
  mensaje?: string;
  members: InviteRsvpMember[];
}

// Raw RSVP form payload (FormData entries + locale). All values are strings.
// Known fields are listed explicitly; the index signature covers the dynamic
// `acompanante_N` / `comida_acompanante_N` keys.
export interface RsvpFormData {
  nombre?: string;
  apellido?: string;
  email?: string;
  whatsapp?: string;
  asistencia?: string;
  acompanantes?: string;
  micro?: string;
  comida_titular?: string;
  alergias?: string;
  mensaje?: string;
  locale?: string;
  [key: string]: string | undefined;
}
