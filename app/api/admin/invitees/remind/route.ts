import { NextResponse } from "next/server";

import type { Invitee } from "@prisma/client";
import { Resend } from "resend";

import { buildRsvpReminderEmail } from "@/lib/email";
import type { ReminderEmailPayload } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// Resend's batch endpoint takes up to 100 emails per call.
const BATCH_SIZE = 100;
const MAX_IDS = 200;

function resolveBaseUrl(request: Request): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";

  return host ? `${proto}://${host}` : "";
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

// Sends an RSVP reminder email to the given pending households.
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Falta configurar RESEND_API_KEY y EMAIL_FROM para enviar recordatorios." },
      { status: 400 },
    );
  }

  let ids: number[] = [];

  try {
    const body = (await request.json()) as { ids?: unknown };

    ids = (Array.isArray(body.ids) ? body.ids : [])
      .map(Number)
      .filter(Number.isInteger);
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (ids.length === 0) {
    return NextResponse.json({ error: "Elegí al menos un hogar." }, { status: 400 });
  }

  if (ids.length > MAX_IDS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_IDS} hogares por envío.` },
      { status: 400 },
    );
  }

  // Re-validate against the database: the admin UI can be stale, and we never
  // want to nudge a household that already answered.
  const invitees = await prisma.invitee.findMany({ where: { id: { in: ids } } });
  const responded = await prisma.rsvp.findMany({
    where: { inviteeId: { in: ids }, deletedAt: null },
    select: { inviteeId: true },
  });
  const respondedIds = new Set(responded.map((rsvp) => rsvp.inviteeId));

  const skippedResponded = invitees.filter((invitee) => respondedIds.has(invitee.id));
  const pending = invitees.filter((invitee) => !respondedIds.has(invitee.id));
  const skippedNoEmail = pending.filter((invitee) => !(invitee.email || "").trim());

  const baseUrl = resolveBaseUrl(request);
  const targets: { invitee: Invitee; email: ReminderEmailPayload }[] = [];

  for (const invitee of pending) {
    const email = buildRsvpReminderEmail(invitee, baseUrl);

    if (email) {
      targets.push({ invitee, email });
    }
  }

  const resend = new Resend(apiKey);
  const replyTo = (process.env.EMAIL_REPLY_TO || "").trim();
  let sent = 0;
  let failed = 0;

  for (const batch of chunk(targets, BATCH_SIZE)) {
    try {
      const { error } = await resend.batch.send(
        batch.map(({ email }) => ({
          from,
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          ...(replyTo ? { replyTo } : {}),
        })),
      );

      if (error) {
        throw new Error(error.message);
      }

      sent += batch.length;
      await prisma.invitee.updateMany({
        where: { id: { in: batch.map(({ invitee }) => invitee.id) } },
        data: { lastRemindedAt: new Date(), remindCount: { increment: 1 } },
      });
    } catch (error) {
      console.error("Reminder batch failed", error);
      failed += batch.length;
    }
  }

  return NextResponse.json({
    sent,
    failed,
    skippedNoEmail: skippedNoEmail.length,
    skippedResponded: skippedResponded.length,
  });
}
