import { NextResponse } from "next/server";

import { parseJson } from "@/lib/guests";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const data = await request.json();
    const guestIds = Array.isArray(data.guestIds)
      ? data.guestIds.map((id) => Number(id)).filter(Number.isInteger)
      : [];
    const tag = typeof data.tag === "string" ? data.tag.trim() : "";

    if (guestIds.length === 0) {
      return NextResponse.json({ error: "Seleccioná al menos un invitado." }, { status: 400 });
    }

    if (!tag) {
      return NextResponse.json({ error: "Escribí un tag." }, { status: 400 });
    }

    const guests = await prisma.guest.findMany({
      where: {
        id: {
          in: guestIds,
        },
      },
      select: {
        id: true,
        tags: true,
      },
    });

    await prisma.$transaction(
      guests.map((guest) => {
        const tags = parseJson(guest.tags, []);
        const nextTags = Array.from(new Set([...tags, tag]));

        return prisma.guest.update({
          where: {
            id: guest.id,
          },
          data: {
            tags: JSON.stringify(nextTags),
          },
        });
      }),
    );

    return NextResponse.json({ ok: true, tag });
  } catch (error) {
    console.error("Add guest tag error", error);

    return NextResponse.json({ error: "No pudimos agregar el tag." }, { status: 500 });
  }
}
