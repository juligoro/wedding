import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function PATCH(request) {
  try {
    const data = await request.json();
    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invitado inválido." }, { status: 400 });
    }

    if (data.action === "restore") {
      const guest = await prisma.guest.update({ where: { id }, data: { deletedAt: null } });

      return NextResponse.json({ guest });
    }

    const existing = await prisma.guest.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "El invitado no existe." }, { status: 404 });
    }

    const firstName =
      typeof data.firstName === "string" ? data.firstName.trim() : existing.firstName;

    if (!firstName) {
      return NextResponse.json({ error: "El nombre no puede quedar vacío." }, { status: 400 });
    }

    const lastName =
      typeof data.lastName === "string" ? data.lastName.trim() : existing.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const attending = typeof data.attending === "boolean" ? data.attending : existing.attending;
    const food = typeof data.food === "string" ? data.food.trim() : existing.food || "";
    const allergies =
      typeof data.allergies === "string" ? data.allergies.trim() : existing.allergies || "";
    const needsBus = typeof data.needsBus === "boolean" ? data.needsBus : existing.needsBus;
    const email =
      typeof data.email === "string" && data.email.trim() ? data.email.trim() : existing.email;
    const whatsapp =
      typeof data.whatsapp === "string" && data.whatsapp.trim()
        ? data.whatsapp.trim()
        : existing.whatsapp;

    const guestData = {
      firstName,
      lastName: lastName || null,
      fullName,
      email,
      whatsapp,
      attending,
    };

    if (attending) {
      guestData.food = food || null;
      guestData.allergies = allergies || null;
      guestData.needsBus = needsBus;
    } else {
      // No longer attending: free the seat and clear meal/bus.
      guestData.food = null;
      guestData.allergies = null;
      guestData.needsBus = null;
      guestData.tableId = null;
    }

    const contactChanged = email !== existing.email || whatsapp !== existing.whatsapp;
    const guest = await prisma.guest.update({ where: { id }, data: guestData });

    // Keep contact info consistent across the whole submission.
    if (contactChanged) {
      await prisma.rsvp.update({ where: { id: existing.rsvpId }, data: { email, whatsapp } });
      await prisma.guest.updateMany({
        where: { rsvpId: existing.rsvpId },
        data: { email, whatsapp },
      });
    }

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Update guest error", error);

    return NextResponse.json({ error: "No pudimos actualizar al invitado." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const data = await request.json().catch(() => ({}));
    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invitado inválido." }, { status: 400 });
    }

    if (data.permanent === true) {
      await prisma.guest.delete({ where: { id } });

      return NextResponse.json({ deleted: 1 });
    }

    await prisma.guest.update({ where: { id }, data: { deletedAt: new Date() } });

    return NextResponse.json({ deleted: 1 });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "El invitado no existe." }, { status: 404 });
    }

    console.error("Delete guest error", error);

    return NextResponse.json({ error: "No pudimos eliminar al invitado." }, { status: 500 });
  }
}
