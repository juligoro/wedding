// Quick helper: prints every household's personalized invite link.
//   node scripts/print-invites.mjs
//   BASE_URL=https://juli-tomi.wedding node scripts/print-invites.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const invitees = await prisma.invitee.findMany({ orderBy: { id: "asc" } });

if (invitees.length === 0) {
  console.log("No hay invitados cargados. Importá una planilla desde /admin primero.");
} else {
  console.log(`\n${invitees.length} hogar(es):`);
  for (const invitee of invitees) {
    let members = [];
    try {
      members = JSON.parse(invitee.members || "[]");
    } catch {
      members = [];
    }
    const names = members.map((m) => `${m.firstName} ${m.lastName}`.trim()).join(", ");
    console.log(`\n• ${invitee.greeting || invitee.fullName}  [${invitee.locale}]  (${members.length} pers.)`);
    console.log(`  miembros: ${names || "—"}`);
    console.log(`  ${base}/i/${invitee.token}`);
  }
  console.log("");
}

await prisma.$disconnect();
