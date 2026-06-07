import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function PATCH(request) {
  try {
    const data = await request.json();
    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invitado inválido." }, { status: 400 });
    }

    const update = {};

    if (typeof data.contacted === "boolean") {
      update.contacted = data.contacted;
    }

    if (data.manualGuestId === null) {
      update.manualGuestId = null;
    } else if (data.manualGuestId !== undefined) {
      const guestId = Number(data.manualGuestId);

      if (!Number.isInteger(guestId)) {
        return NextResponse.json({ error: "Invitado a vincular inválido." }, { status: 400 });
      }

      update.manualGuestId = guestId;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
    }

    const invitee = await prisma.invitee.update({ where: { id }, data: update });

    return NextResponse.json({ invitee });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "El invitado no existe." }, { status: 404 });
    }

    console.error("Update invitee error", error);

    return NextResponse.json({ error: "No pudimos actualizar al invitado." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const data = await request.json().catch(() => ({}));

    if (data.all === true) {
      const result = await prisma.invitee.deleteMany({});

      return NextResponse.json({ deleted: result.count });
    }

    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invitado inválido." }, { status: 400 });
    }

    await prisma.invitee.delete({ where: { id } });

    return NextResponse.json({ deleted: 1 });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "El invitado no existe." }, { status: 404 });
    }

    console.error("Delete invitee error", error);

    return NextResponse.json({ error: "No pudimos eliminar al invitado." }, { status: 500 });
  }
}
