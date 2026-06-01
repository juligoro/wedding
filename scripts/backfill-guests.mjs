import { buildGuestsFromRsvp } from "../lib/guests.js";
import { prisma } from "../lib/prisma.js";

const rsvps = await prisma.rsvp.findMany({
  include: {
    guests: true,
  },
});

for (const rsvp of rsvps) {
  if (rsvp.guests.length > 0) {
    continue;
  }

  await prisma.guest.createMany({
    data: buildGuestsFromRsvp(rsvp).map((guest) => ({
      ...guest,
      rsvpId: rsvp.id,
    })),
  });
}

await prisma.$disconnect();
