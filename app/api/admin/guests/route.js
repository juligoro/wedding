import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function PATCH(request) {
  try {
    const data = await request.json();
    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invitado inválido." }, { status: 400 });
    }

    const firstName = typeof data.firstName === "string" ? data.firstName.trim() : "";

    if (!firstName) {
      return NextResponse.json({ error: "El nombre no puede quedar vacío." }, { status: 400 });
    }

    const lastName = typeof data.lastName === "string" ? data.lastName.trim() : "";
    const food = typeof data.food === "string" ? data.food.trim() : "";
    const allergies = typeof data.allergies === "string" ? data.allergies.trim() : "";
    const needsBus = typeof data.needsBus === "boolean" ? data.needsBus : null;
    const fullName = `${firstName} ${lastName}`.trim();

    const existing = await prisma.guest.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "El invitado no existe." }, { status: 404 });
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        firstName,
        lastName: lastName || null,
        fullName,
        food: food || null,
        allergies: allergies || null,
        needsBus,
      },
    });

    return NextResponse.json({ guest });
  } catch (error) {
    console.error("Update guest error", error);

    return NextResponse.json({ error: "No pudimos actualizar al invitado." }, { status: 500 });
  }
}
