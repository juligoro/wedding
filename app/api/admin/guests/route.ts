import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
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

    const guestData: Prisma.GuestUncheckedUpdateInput = {
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

export async function DELETE(request: Request) {
  try {
    const data = await request.json().catch(() => ({}));

    // Bulk: { ids: [...] }
    if (Array.isArray(data.ids)) {
      const ids = Array.from(new Set<number>(data.ids.map(Number).filter(Number.isInteger)));

      if (ids.length === 0) {
        return NextResponse.json({ error: "No hay invitados seleccionados." }, { status: 400 });
      }

      if (data.permanent === true) {
        const result = await prisma.guest.deleteMany({ where: { id: { in: ids } } });

        return NextResponse.json({ deleted: result.count });
      }

      const result = await prisma.guest.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ deleted: result.count });
    }

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
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "El invitado no existe." }, { status: 404 });
    }

    console.error("Delete guest error", error);

    return NextResponse.json({ error: "No pudimos eliminar al invitado." }, { status: 500 });
  }
}
