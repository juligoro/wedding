import type { Guest, Invitee, Rsvp, SeatingTable } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import AdminDashboard from "./AdminDashboard";
import "./admin.css";
import type {
  SerializedGuest,
  SerializedInvitee,
  SerializedRsvpShallow,
  SerializedSeatingTable,
  SerializedSubmission,
  SerializedTable,
} from "./types";

export const dynamic = "force-dynamic";

type GuestWithRelations = Guest & { table?: SeatingTable | null; rsvp?: Rsvp };
type RsvpWithGuests = Rsvp & { guests: GuestWithRelations[] };

function iso(value: Date): string;
function iso(value: Date | null | undefined): string | null;
function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function serializeTable(table: SeatingTable | null): SerializedTable | null {
  if (!table) {
    return null;
  }

  return { ...table, createdAt: iso(table.createdAt), updatedAt: iso(table.updatedAt) };
}

function serializeRsvpShallow(rsvp: Rsvp): SerializedRsvpShallow {
  return {
    ...rsvp,
    deletedAt: iso(rsvp.deletedAt),
    createdAt: iso(rsvp.createdAt),
    updatedAt: iso(rsvp.updatedAt),
  };
}

function serializeGuest(guest: GuestWithRelations): SerializedGuest {
  return {
    ...guest,
    deletedAt: iso(guest.deletedAt),
    createdAt: iso(guest.createdAt),
    updatedAt: iso(guest.updatedAt),
    ...(guest.table !== undefined ? { table: serializeTable(guest.table) } : {}),
    ...(guest.rsvp !== undefined ? { rsvp: serializeRsvpShallow(guest.rsvp) } : {}),
  } as SerializedGuest;
}

function serializeRsvp(rsvp: RsvpWithGuests): SerializedSubmission {
  return { ...serializeRsvpShallow(rsvp), guests: rsvp.guests.map(serializeGuest) };
}

function serializeInvitee(invitee: Invitee): SerializedInvitee {
  return {
    ...invitee,
    firstOpenedAt: iso(invitee.firstOpenedAt),
    lastOpenedAt: iso(invitee.lastOpenedAt),
    lastRemindedAt: iso(invitee.lastRemindedAt),
    deletedAt: iso(invitee.deletedAt),
    createdAt: iso(invitee.createdAt),
    updatedAt: iso(invitee.updatedAt),
  };
}

export default async function AdminPage() {
  const rsvps = await prisma.rsvp.findMany({
    where: { deletedAt: null },
    include: {
      guests: {
        where: { deletedAt: null },
        include: { table: true },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const tables = await prisma.seatingTable.findMany({
    include: {
      guests: {
        where: { deletedAt: null },
        orderBy: { fullName: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  const inviteeRecords = await prisma.invitee.findMany({
    where: { deletedAt: null },
    orderBy: { fullName: "asc" },
  });
  const deletedInvitees = await prisma.invitee.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });
  const deletedRsvps = await prisma.rsvp.findMany({
    where: { deletedAt: { not: null } },
    include: { guests: { orderBy: { id: "asc" } } },
    orderBy: { deletedAt: "desc" },
  });
  const deletedGuests = await prisma.guest.findMany({
    where: { deletedAt: { not: null }, rsvp: { deletedAt: null } },
    include: { rsvp: true, table: true },
    orderBy: { deletedAt: "desc" },
  });

  const submissions = rsvps.map(serializeRsvp);
  const seatingTables: SerializedSeatingTable[] = tables.map((table) => ({
    ...(serializeTable(table) as SerializedTable),
    guests: table.guests.map(serializeGuest),
  }));
  const invitees: SerializedInvitee[] = inviteeRecords.map(serializeInvitee);
  const trash = {
    rsvps: deletedRsvps.map(serializeRsvp),
    guests: deletedGuests.map(serializeGuest),
    invitees: deletedInvitees.map(serializeInvitee),
  };

  return (
    <AdminDashboard
      submissions={submissions}
      tables={seatingTables}
      invitees={invitees}
      trash={trash}
    />
  );
}
