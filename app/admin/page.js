import AdminDashboard from "./AdminDashboard";
import "./admin.css";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function iso(value) {
  return value ? value.toISOString() : null;
}

function serializeTable(table) {
  if (!table) {
    return null;
  }

  return { ...table, createdAt: iso(table.createdAt), updatedAt: iso(table.updatedAt) };
}

function serializeRsvpShallow(rsvp) {
  return {
    ...rsvp,
    deletedAt: iso(rsvp.deletedAt),
    createdAt: iso(rsvp.createdAt),
    updatedAt: iso(rsvp.updatedAt),
  };
}

function serializeGuest(guest) {
  return {
    ...guest,
    deletedAt: iso(guest.deletedAt),
    createdAt: iso(guest.createdAt),
    updatedAt: iso(guest.updatedAt),
    ...(guest.table !== undefined ? { table: serializeTable(guest.table) } : {}),
    ...(guest.rsvp !== undefined ? { rsvp: serializeRsvpShallow(guest.rsvp) } : {}),
  };
}

function serializeRsvp(rsvp) {
  return { ...serializeRsvpShallow(rsvp), guests: rsvp.guests.map(serializeGuest) };
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
    orderBy: { fullName: "asc" },
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
  const seatingTables = tables.map((table) => ({
    ...serializeTable(table),
    guests: table.guests.map(serializeGuest),
  }));
  const invitees = inviteeRecords.map((invitee) => ({
    ...invitee,
    createdAt: iso(invitee.createdAt),
    updatedAt: iso(invitee.updatedAt),
  }));
  const trash = {
    rsvps: deletedRsvps.map(serializeRsvp),
    guests: deletedGuests.map(serializeGuest),
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
