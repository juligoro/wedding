import AdminDashboard from "./AdminDashboard";
import "./admin.css";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const rsvps = await prisma.rsvp.findMany({
    include: {
      guests: {
        include: {
          table: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const tables = await prisma.seatingTable.findMany({
    include: {
      guests: {
        orderBy: {
          fullName: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
  const inviteeRecords = await prisma.invitee.findMany({
    orderBy: {
      fullName: "asc",
    },
  });

  const submissions = rsvps.map((rsvp) => ({
    ...rsvp,
    createdAt: rsvp.createdAt.toISOString(),
    updatedAt: rsvp.updatedAt.toISOString(),
    guests: rsvp.guests.map((guest) => ({
      ...guest,
      createdAt: guest.createdAt.toISOString(),
      updatedAt: guest.updatedAt.toISOString(),
      table: guest.table
        ? {
            ...guest.table,
            createdAt: guest.table.createdAt.toISOString(),
            updatedAt: guest.table.updatedAt.toISOString(),
          }
        : null,
    })),
  }));
  const seatingTables = tables.map((table) => ({
    ...table,
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString(),
    guests: table.guests.map((guest) => ({
      ...guest,
      createdAt: guest.createdAt.toISOString(),
      updatedAt: guest.updatedAt.toISOString(),
    })),
  }));

  const invitees = inviteeRecords.map((invitee) => ({
    ...invitee,
    createdAt: invitee.createdAt.toISOString(),
    updatedAt: invitee.updatedAt.toISOString(),
  }));

  return (
    <AdminDashboard submissions={submissions} tables={seatingTables} invitees={invitees} />
  );
}
