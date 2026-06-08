import { NextResponse } from "next/server";

import { normalizeName } from "@/lib/guests";
import { generateInviteToken, joinNames } from "@/lib/invite";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/types";

// Create a single household by hand (no spreadsheet).
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const members = (Array.isArray(data.members) ? data.members : [])
      .map((member: { firstName?: unknown; lastName?: unknown }) => ({
        firstName: String(member?.firstName ?? "").trim(),
        lastName: String(member?.lastName ?? "").trim(),
      }))
      .filter((member: { firstName: string }) => member.firstName);

    if (members.length === 0) {
      return NextResponse.json(
        { error: "Agregá al menos una persona con nombre." },
        { status: 400 },
      );
    }

    const locale: Locale = data.locale === "en" ? "en" : "es";
    const greeting =
      String(data.greeting ?? "").trim() ||
      joinNames(
        members.map((member: { firstName: string }) => member.firstName),
        locale,
      );

    const base = {
      fullName: greeting,
      normalized: normalizeName(greeting),
      greeting,
      locale,
      members: JSON.stringify(members),
      household: String(data.household ?? "").trim() || null,
      email: String(data.email ?? "").trim() || null,
      whatsapp: String(data.whatsapp ?? "").trim() || null,
      party: members.length,
      notes: String(data.notes ?? "").trim() || null,
    };

    // Retry on the (astronomically unlikely) token collision.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const invitee = await prisma.invitee.create({
          data: { ...base, token: generateInviteToken() },
        });

        return NextResponse.json({ invitee });
      } catch (error) {
        if ((error as { code?: string }).code === "P2002" && attempt < 3) {
          continue;
        }

        throw error;
      }
    }

    return NextResponse.json({ error: "No pudimos agregar el hogar." }, { status: 500 });
  } catch (error) {
    console.error("Create invitee error", error);

    return NextResponse.json({ error: "No pudimos agregar el hogar." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const id = Number(data.id);

    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Invitado inválido." }, { status: 400 });
    }

    const update: { contacted?: boolean; manualGuestId?: number | null } = {};

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
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "El invitado no existe." }, { status: 404 });
    }

    console.error("Update invitee error", error);

    return NextResponse.json({ error: "No pudimos actualizar al invitado." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "El invitado no existe." }, { status: 404 });
    }

    console.error("Delete invitee error", error);

    return NextResponse.json({ error: "No pudimos eliminar al invitado." }, { status: 500 });
  }
}
