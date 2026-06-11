import type { Metadata } from "next";
import { notFound } from "next/navigation";

import InviteConfirmed from "@/components/InviteConfirmed";
import InviteOpenPing from "@/components/InviteOpenPing";
import WeddingLanding from "@/components/WeddingLanding";
import { parseJson } from "@/lib/guests";
import { prisma } from "@/lib/prisma";
import { isEditOpen } from "@/lib/rsvpEdit";
import type {
  InvitePreviousResponse,
  InviteeContext,
  InviteeMember,
  Locale,
} from "@/lib/types";

// Personalized links are private; never index them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Always reflect the current "responded" state for this household.
export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { token } = await params;
  const { edit } = await searchParams;

  const invitee = await prisma.invitee.findUnique({
    where: { token },
    include: {
      rsvps: {
        where: { deletedAt: null },
        include: {
          guests: {
            where: { deletedAt: null },
            orderBy: { id: "asc" },
          },
        },
        take: 1,
      },
    },
  });

  if (!invitee) {
    notFound();
  }

  const locale: Locale = invitee.locale === "en" ? "en" : "es";
  const greeting = invitee.greeting || invitee.fullName;
  const editOpen = isEditOpen();

  const context: InviteeContext = {
    token: invitee.token,
    greeting,
    locale,
    members: parseJson<InviteeMember[]>(invitee.members, []),
    email: invitee.email ?? "",
    whatsapp: invitee.whatsapp ?? "",
  };

  const rsvp = invitee.rsvps[0];

  if (rsvp) {
    // Until the deadline, ?edit=1 reopens the form prefilled with the previous
    // answers (taken from the live Guest rows, so admin corrections show too).
    if (edit === "1" && editOpen && rsvp.guests.length > 0) {
      const previous: InvitePreviousResponse = {
        members: rsvp.guests.map((guest) => ({
          firstName: guest.firstName,
          lastName: guest.lastName ?? "",
          attending: guest.attending,
          food: guest.food ?? "Ninguna",
          email: guest.email,
          whatsapp: guest.whatsapp,
          allergies: guest.allergies ?? "",
        })),
        needsBus: rsvp.needsBus,
        message: rsvp.message ?? "",
      };

      return (
        <>
          <InviteOpenPing token={invitee.token} />
          <WeddingLanding locale={locale} invitee={context} previous={previous} />
        </>
      );
    }

    return (
      <>
        <InviteOpenPing token={invitee.token} />
        <InviteConfirmed
          greeting={greeting}
          locale={locale}
          token={invitee.token}
          canEdit={editOpen}
          plural={context.members.length > 1}
        />
      </>
    );
  }

  return (
    <>
      <InviteOpenPing token={invitee.token} />
      <WeddingLanding locale={locale} invitee={context} />
    </>
  );
}
