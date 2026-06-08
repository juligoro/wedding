import { NextResponse } from "next/server";

import type { Prisma } from "@prisma/client";

import { sendRsvpConfirmation } from "@/lib/email";
import { buildGuestsFromMembers, buildGuestsFromRsvp } from "@/lib/guests";
import { prisma } from "@/lib/prisma";
import type { CompanionFood, InviteRsvpMember, InviteRsvpPayload, RsvpFormData } from "@/lib/types";

function getText(data: RsvpFormData, key: string): string {
  const value = data[key];

  return typeof value === "string" ? value.trim() : "";
}

function getCompanions(data: RsvpFormData, companionCount: number): string[] {
  return Array.from({ length: companionCount }, (_, index) =>
    getText(data, `acompanante_${index + 1}`),
  ).filter(Boolean);
}

function getCompanionFood(data: RsvpFormData, companionCount: number): CompanionFood[] {
  return Array.from({ length: companionCount }, (_, index) => ({
    name: getText(data, `acompanante_${index + 1}`),
    restriction: getText(data, `comida_acompanante_${index + 1}`) || "Ninguna",
  }));
}

function resolveBaseUrl(request: Request): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";

  return host ? `${proto}://${host}` : "";
}

function memberName(member: { firstName: string; lastName: string }): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

function isInvitePayload(data: unknown): data is InviteRsvpPayload {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { token?: unknown }).token === "string" &&
    Array.isArray((data as { members?: unknown }).members)
  );
}

// --- Personalized-link RSVP: per-person attendance, linked to the household. ---
async function handleInviteRsvp(payload: InviteRsvpPayload, request: Request): Promise<NextResponse> {
  const invitee = await prisma.invitee.findUnique({ where: { token: payload.token } });

  if (!invitee) {
    return NextResponse.json({ error: "No encontramos tu invitación." }, { status: 404 });
  }

  const members: InviteRsvpMember[] = (Array.isArray(payload.members) ? payload.members : [])
    .map((member) => ({
      firstName: String(member?.firstName ?? "").trim(),
      lastName: String(member?.lastName ?? "").trim(),
      attending: Boolean(member?.attending),
      food: String(member?.food ?? "").trim() || "Ninguna",
    }))
    .filter((member) => member.firstName);

  if (members.length === 0) {
    return NextResponse.json({ error: "Faltan los nombres de los invitados." }, { status: 400 });
  }

  const email = String(payload.email ?? "").trim();
  const whatsapp = String(payload.whatsapp ?? "").trim();

  if (!email || !whatsapp) {
    return NextResponse.json({ error: "Faltan datos de contacto." }, { status: 400 });
  }

  const anyAttending = members.some((member) => member.attending);
  const needsBus = anyAttending ? payload.micro === "si" : null;

  // One confirmation per household. If they need changes, they contact the couple.
  const existing = await prisma.rsvp.findFirst({
    where: { inviteeId: invitee.id, deletedAt: null },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ya recibimos la confirmación de este grupo. Si necesitás cambiar algo, escribinos." },
      { status: 409 },
    );
  }

  // The RSVP aggregate (used by the confirmation email's "we're expecting" line)
  // reflects only who's attending: lead = first attending member, companions =
  // the other attending members. The full per-person truth lives in Guest rows
  // (built below from every member, attending or not).
  const lead = (anyAttending ? members.find((member) => member.attending) : members[0]) ?? members[0];
  const attendingOthers = members.filter((member) => member !== lead && member.attending);
  const allergies = anyAttending ? String(payload.alergias ?? "").trim() || null : null;
  const message = String(payload.mensaje ?? "").trim() || null;

  const rsvp = await prisma.rsvp.create({
    data: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email,
      whatsapp,
      attending: anyAttending,
      companionCount: attendingOthers.length,
      companions: JSON.stringify(attendingOthers.map(memberName)),
      primaryFood: lead.attending ? lead.food || "Ninguna" : null,
      companionFood: JSON.stringify(
        attendingOthers.map((member) => ({
          name: memberName(member),
          restriction: member.food || "Ninguna",
        })),
      ),
      allergies,
      needsBus,
      message,
      inviteeId: invitee.id,
    },
  });

  await prisma.guest.createMany({
    data: buildGuestsFromMembers(members, { email, whatsapp, allergies, needsBus }).map(
      (guest): Prisma.GuestCreateManyInput => ({
        ...guest,
        rsvpId: rsvp.id,
      }),
    ),
  });

  if (anyAttending) {
    const locale = payload.locale === "en" ? "en" : "es";
    const baseUrl = resolveBaseUrl(request);

    // Best-effort: a mail failure must not fail the RSVP.
    try {
      await sendRsvpConfirmation({ rsvp, locale, baseUrl });
    } catch (emailError) {
      console.error("RSVP confirmation email failed", emailError);
    }
  }

  return NextResponse.json({ id: rsvp.id }, { status: 201 });
}

// --- Open form RSVP: single attendance toggle + companions list. ---
async function handleOpenRsvp(data: RsvpFormData, request: Request): Promise<NextResponse> {
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
    data: buildGuestsFromRsvp(rsvp).map(
      (guest): Prisma.GuestCreateManyInput => ({
        ...guest,
        rsvpId: rsvp.id,
      }),
    ),
  });

  if (attending) {
    const locale = data.locale === "en" ? "en" : "es";
    const baseUrl = resolveBaseUrl(request);

    // Best-effort: a mail failure must not fail the RSVP.
    try {
      await sendRsvpConfirmation({ rsvp, locale, baseUrl });
    } catch (emailError) {
      console.error("RSVP confirmation email failed", emailError);
    }
  }

  return NextResponse.json({ id: rsvp.id }, { status: 201 });
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;

    if (isInvitePayload(raw)) {
      return await handleInviteRsvp(raw, request);
    }

    return await handleOpenRsvp(raw as RsvpFormData, request);
  } catch (error) {
    console.error("RSVP submit error", error);

    return NextResponse.json({ error: "No pudimos guardar la confirmación." }, { status: 500 });
  }
}
