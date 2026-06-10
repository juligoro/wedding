// Guests can edit their RSVP through their invite link until this deadline.
// RSVP_EDIT_DEADLINE is an ISO date with offset (e.g. "2026-10-31T23:59:59-03:00");
// when unset or invalid, editing stays open indefinitely.

export function getEditDeadline(): Date | null {
  const raw = process.env.RSVP_EDIT_DEADLINE?.trim();

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isEditOpen(now: Date = new Date()): boolean {
  const deadline = getEditDeadline();

  return !deadline || now <= deadline;
}
