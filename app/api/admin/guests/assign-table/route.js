import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const data = await request.json();
    const guestIds = Array.isArray(data.guestIds)
      ? data.guestIds.map((id) => Number(id)).filter(Number.isInteger)
      : [];
    const tableId = data.tableId === null ? null : Number(data.tableId);

    if (guestIds.length === 0) {
      return NextResponse.json({ error: "Seleccioná al menos un invitado." }, { status: 400 });
    }

    if (tableId !== null && !Number.isInteger(tableId)) {
      return NextResponse.json({ error: "Mesa inválida." }, { status: 400 });
    }

    if (tableId !== null) {
      const table = await prisma.seatingTable.findUnique({
        where: {
          id: tableId,
        },
        include: {
          guests: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!table) {
        return NextResponse.json({ error: "La mesa no existe." }, { status: 404 });
      }

      const currentGuestIds = new Set(table.guests.map((guest) => guest.id));
      const incomingNewGuests = guestIds.filter((guestId) => !currentGuestIds.has(guestId));

      if (table.guests.length + incomingNewGuests.length > table.capacity) {
        return NextResponse.json(
          { error: `La mesa ${table.name} admite hasta ${table.capacity} personas.` },
          { status: 400 },
        );
      }
    }

    await prisma.guest.updateMany({
      where: {
        id: {
          in: guestIds,
        },
        attending: true,
      },
      data: {
        tableId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Assign table error", error);

    return NextResponse.json({ error: "No pudimos asignar la mesa." }, { status: 500 });
  }
}
