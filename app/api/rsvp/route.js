import { NextResponse } from "next/server";

import { sendRsvpConfirmation } from "@/lib/email";
import { buildGuestsFromRsvp } from "@/lib/guests";
import { prisma } from "@/lib/prisma";

function getText(data, key) {
  const value = data[key];

  return typeof value === "string" ? value.trim() : "";
}

function getCompanions(data, companionCount) {
  return Array.from({ length: companionCount }, (_, index) =>
    getText(data, `acompanante_${index + 1}`),
  ).filter(Boolean);
}

function getCompanionFood(data, companionCount) {
  return Array.from({ length: companionCount }, (_, index) => ({
    name: getText(data, `acompanante_${index + 1}`),
    restriction: getText(data, `comida_acompanante_${index + 1}`) || "Ninguna",
  }));
}

export async function POST(request) {
  try {
    const data = await request.json();
    const attending = data.asistencia === "si";
    const companionCount = attending ? Number(getText(data, "acompanantes") || 0) : 0;

    const firstName = getText(data, "nombre");
    const lastName = getText(data, "apellido");
    const email = getText(data, "email");
    const whatsapp = getText(data, "whatsapp");

    if (!firstName || !lastName || !email || !whatsapp || !data.asistencia) {
      return NextResponse.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }

    if (!Number.isInteger(companionCount) || companionCount < 0 || companionCount > 4) {
      return NextResponse.json({ error: "Cantidad de acompañantes inválida." }, { status: 400 });
    }

    if (attending && data.micro !== "si" && data.micro !== "no") {
      return NextResponse.json({ error: "Falta confirmar la movilidad." }, { status: 400 });
    }

    const companions = getCompanions(data, companionCount);

    if (attending && companions.length !== companionCount) {
      return NextResponse.json({ error: "Faltan datos de acompañantes." }, { status: 400 });
    }

    const rsvp = await prisma.rsvp.create({
      data: {
        firstName,
        lastName,
        email,
        whatsapp,
        attending,
        companionCount,
        companions: JSON.stringify(companions),
        primaryFood: attending ? getText(data, "comida_titular") || "Ninguna" : null,
        companionFood: JSON.stringify(attending ? getCompanionFood(data, companionCount) : []),
        allergies: attending ? getText(data, "alergias") || null : null,
        needsBus: attending ? data.micro === "si" : null,
        message: getText(data, "mensaje") || null,
      },
    });

    await prisma.guest.createMany({
      data: buildGuestsFromRsvp(rsvp).map((guest) => ({
        ...guest,
        rsvpId: rsvp.id,
      })),
    });

    if (attending) {
      const locale = data.locale === "en" ? "en" : "es";
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || "https";
      const baseUrl = host ? `${proto}://${host}` : "";

      // Best-effort: a mail failure must not fail the RSVP.
      try {
        await sendRsvpConfirmation({ rsvp, locale, baseUrl });
      } catch (emailError) {
        console.error("RSVP confirmation email failed", emailError);
      }
    }

    return NextResponse.json({ id: rsvp.id }, { status: 201 });
  } catch (error) {
    console.error("RSVP submit error", error);

    return NextResponse.json({ error: "No pudimos guardar la confirmación." }, { status: 500 });
  }
}
