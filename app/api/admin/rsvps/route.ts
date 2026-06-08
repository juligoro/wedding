import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Soft-delete (or permanently delete) a whole RSVP and its guests.
export async function DELETE(request: Request) {
  try {
    const data = await request.json().catch(() => ({}));
    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Envío inválido." }, { status: 400 });
    }

    if (data.permanent === true) {
      await prisma.rsvp.delete({ where: { id } }); // cascade-deletes its guests

      return NextResponse.json({ deleted: 1 });
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.guest.updateMany({ where: { rsvpId: id }, data: { deletedAt: now } }),
      prisma.rsvp.update({ where: { id }, data: { deletedAt: now } }),
    ]);

    return NextResponse.json({ deleted: 1 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "El envío no existe." }, { status: 404 });
    }

    console.error("Delete rsvp error", error);

    return NextResponse.json({ error: "No pudimos eliminar el envío." }, { status: 500 });
  }
}

// Restore a soft-deleted RSVP and its guests.
export async function PATCH(request: Request) {
  try {
    const data = await request.json().catch(() => ({}));
    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Envío inválido." }, { status: 400 });
    }

    if (data.action !== "restore") {
      return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.guest.updateMany({ where: { rsvpId: id }, data: { deletedAt: null } }),
      prisma.rsvp.update({ where: { id }, data: { deletedAt: null } }),
    ]);

    return NextResponse.json({ restored: 1 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "El envío no existe." }, { status: 404 });
    }

    console.error("Restore rsvp error", error);

    return NextResponse.json({ error: "No pudimos restaurar el envío." }, { status: 500 });
  }
}
