import type { Metadata } from "next";
import { notFound } from "next/navigation";

import FaqPage from "@/components/FaqPage";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/types";

// Personalized links are private; never index them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Preguntas frecuentes | Juli & Tomi",
};

export const dynamic = "force-dynamic";

// FAQ for invited guests: includes the venue navigation links.
export default async function InviteFaqPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invitee = await prisma.invitee.findUnique({
    where: { token },
    select: { locale: true },
  });

  if (!invitee) {
    notFound();
  }

  const locale: Locale = invitee.locale === "en" ? "en" : "es";

  return <FaqPage locale={locale} backHref={`/i/${token}`} showVenueLinks />;
}
