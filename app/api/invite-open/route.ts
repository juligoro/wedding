import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Belt-and-braces: the beacon already filters bots (they don't run JS), but
// reject known link-preview crawlers in case one ever POSTs here.
const BOT_AGENTS = [
  "whatsapp",
  "facebookexternalhit",
  "telegrambot",
  "twitterbot",
  "slackbot",
  "linkedinbot",
  "discordbot",
  "googlebot",
  "bingbot",
];

function done(): NextResponse {
  // Always 204: never reveal whether a token exists.
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

  if (BOT_AGENTS.some((bot) => userAgent.includes(bot))) {
    return done();
  }

  let token = "";

  try {
    // sendBeacon posts text/plain, so parse the raw body instead of .json().
    const body = JSON.parse(await request.text()) as { token?: unknown };

    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    return done();
  }

  if (!token) {
    return done();
  }

  try {
    const now = new Date();

    await prisma.invitee.updateMany({
      where: { token, firstOpenedAt: null },
      data: { firstOpenedAt: now },
    });
    await prisma.invitee.updateMany({
      where: { token },
      data: { lastOpenedAt: now, openCount: { increment: 1 } },
    });
  } catch (error) {
    console.error("invite-open tracking failed", error);
  }

  return done();
}
