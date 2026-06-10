import type { Guest, Invitee, Rsvp, SeatingTable } from "@prisma/client";

// Server components serialize Prisma `Date` fields to ISO strings (or null)
// before passing them to the client. This maps a Prisma model to that shape.
type Serialized<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K];
};

export type SerializedTable = Serialized<SeatingTable>;
export type SerializedInvitee = Serialized<Invitee>;
export type SerializedRsvpShallow = Serialized<Rsvp>;

export type SerializedGuest = Serialized<Guest> & {
  table?: SerializedTable | null;
  rsvp?: SerializedRsvpShallow;
};

export type SerializedSubmission = SerializedRsvpShallow & {
  guests: SerializedGuest[];
};

export type SerializedSeatingTable = SerializedTable & {
  guests: SerializedGuest[];
};

export interface Trash {
  rsvps: SerializedSubmission[];
  guests: SerializedGuest[];
}

// Optimistic per-guest edits held in the admin context (id -> overrides).
export interface GuestEdit {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  food?: string;
  allergies?: string;
  needsBus?: boolean | null;
  email?: string;
  whatsapp?: string;
  attending?: boolean;
}

// A flattened guest row (one per guest) as rendered in the dashboard table.
export interface Row {
  id: number;
  submissionId: number;
  inviteeId: number | null;
  firstName: string;
  lastName: string;
  name: string;
  food: string;
  role: string;
  needsBus: boolean | null;
  allergies: string;
  email: string;
  whatsapp: string;
  tags: string[];
  submittedBy: string;
  submittedAt: string | null;
  attending: boolean;
  tableId: number | null;
  tableName: string;
}

export interface RowFilters {
  query: string;
  statusFilter: string;
  mealFilter: string;
  busFilter: string;
}

export type MatchConfidence = "link" | "manual" | "exact" | "tokens" | "email" | "partial" | "none";
export type InviteeStatus = "accepted" | "declined" | "pending";

// An invitee from the uploaded list, reconciled against the live RSVP rows.
export type ReconcileItem = SerializedInvitee & {
  normalized: string;
  matchedGuest: Row | null;
  confidence: MatchConfidence;
  status: InviteeStatus;
};

export interface ReconcileStats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  contacted: number;
  openedPending: number;
  extras: number;
}

export interface ReconcileResult {
  items: ReconcileItem[];
  extras: Row[];
  stats: ReconcileStats;
}
