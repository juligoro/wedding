// Shared domain types used across the data layer, API routes and the UI.

export type Locale = "es" | "en";

// One companion's dietary restriction, as stored in Rsvp.companionFood (JSON).
export interface CompanionFood {
  name: string;
  restriction: string;
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
  email: string | null;
  whatsapp: string | null;
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
