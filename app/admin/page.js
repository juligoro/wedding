import AdminDashboard from "./AdminDashboard";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const rsvps = await prisma.rsvp.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const submissions = rsvps.map((rsvp) => ({
    ...rsvp,
    createdAt: rsvp.createdAt.toISOString(),
    updatedAt: rsvp.updatedAt.toISOString(),
  }));

  return <AdminDashboard submissions={submissions} />;
}
