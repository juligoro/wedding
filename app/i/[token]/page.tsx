import type { Metadata } from "next";
import { notFound } from "next/navigation";

import InviteConfirmed from "@/components/InviteConfirmed";
import WeddingLanding from "@/components/WeddingLanding";
import { parseJson } from "@/lib/guests";
import { prisma } from "@/lib/prisma";
import type { InviteeContext, InviteeMember, Locale } from "@/lib/types";

// Personalized links are private; never index them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Always reflect the current "responded" state for this household.
export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invitee = await prisma.invitee.findUnique({
    where: { token },
    include: {
      rsvps: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!invitee) {
    notFound();
  }

  const locale: Locale = invitee.locale === "en" ? "en" : "es";
  const greeting = invitee.greeting || invitee.fullName;

  // Already responded → show the confirmation screen instead of the form.
  if (invitee.rsvps.length > 0) {
    return <InviteConfirmed greeting={greeting} locale={locale} />;
  }

  const context: InviteeContext = {
    token: invitee.token,
    greeting,
    locale,
    members: parseJson<InviteeMember[]>(invitee.members, []),
    email: invitee.email ?? "",
    whatsapp: invitee.whatsapp ?? "",
  };

  return <WeddingLanding locale={locale} invitee={context} />;
}
