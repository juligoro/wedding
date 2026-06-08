import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { normalizeName, parseJson, splitName } from "@/lib/guests";
import { generateUniqueToken, joinNames, memberFullName, parseLocale } from "@/lib/invite";
import { prisma } from "@/lib/prisma";
import type { InviteeMember, Locale } from "@/lib/types";

const NAME_HEADERS = [
  "nombre completo",
  "nombre y apellido",
  "nombres y apellidos",
  "nombre del invitado",
  "invitado",
  "invitada",
  "invitados",
  "name",
  "full name",
];
const FIRST_HEADERS = ["nombre", "nombres", "first name", "first", "primer nombre"];
const LAST_HEADERS = ["apellido", "apellidos", "last name", "surname"];
const EMAIL_HEADERS = ["email", "correo", "correo electronico", "mail", "e mail"];
const PHONE_HEADERS = [
  "whatsapp",
  "wpp",
  "telefono",
  "celular",
  "phone",
  "tel",
  "movil",
  "numero",
  "numero de telefono",
];
const GROUP_HEADERS = ["grupo", "hogar", "familia", "group", "household"];
const GREETING_HEADERS = [
  "saludo",
  "nombre a mostrar",
  "como saludar",
  "greeting",
  "display",
  "display name",
];
const LOCALE_HEADERS = ["idioma", "language", "lang", "lengua"];
const NOTES_HEADERS = ["notas", "nota", "observaciones", "comentarios", "comentario"];

interface DetectedColumns {
  headers: string[];
  lastIdx: number;
  firstIdx: number;
  combinedIdx: number;
  emailIdx: number;
  phoneIdx: number;
  groupIdx: number;
  greetingIdx: number;
  localeIdx: number;
  notesIdx: number;
}

interface Household {
  groupLabel: string;
  greeting: string;
  locale: Locale | "";
  email: string;
  whatsapp: string;
  notes: string;
  members: InviteeMember[];
  memberKeys: Set<string>;
}

function findColumn(headers: string[], candidates: string[]): number {
  for (let index = 0; index < headers.length; index += 1) {
    if (candidates.includes(headers[index])) {
      return index;
    }
  }

  return -1;
}

function cell(row: unknown[], index: number): string {
  if (index < 0) {
    return "";
  }

  return String(row[index] ?? "").trim();
}

function detectColumns(rawHeaders: string[]): DetectedColumns {
  const headers = rawHeaders.map((header) => normalizeName(header));

  // "familia"/"grupo" overlap the group headers; only treat the name column as
  // group if there's no dedicated name column conflict. Group detection runs
  // against its own list, so a "Familia" header maps to the group key.
  return {
    headers: rawHeaders,
    lastIdx: findColumn(headers, LAST_HEADERS),
    firstIdx: findColumn(headers, FIRST_HEADERS),
    combinedIdx: findColumn(headers, NAME_HEADERS),
    emailIdx: findColumn(headers, EMAIL_HEADERS),
    phoneIdx: findColumn(headers, PHONE_HEADERS),
    groupIdx: findColumn(headers, GROUP_HEADERS),
    greetingIdx: findColumn(headers, GREETING_HEADERS),
    localeIdx: findColumn(headers, LOCALE_HEADERS),
    notesIdx: findColumn(headers, NOTES_HEADERS),
  };
}

function memberFromRow(row: unknown[], columns: DetectedColumns): InviteeMember {
  if (columns.firstIdx >= 0) {
    return {
      firstName: cell(row, columns.firstIdx),
      lastName: columns.lastIdx >= 0 ? cell(row, columns.lastIdx) : "",
    };
  }

  const full = columns.combinedIdx >= 0 ? cell(row, columns.combinedIdx) : cell(row, 0);
  const { firstName, lastName } = splitName(full);

  return { firstName, lastName };
}

// Stable identity for a household across re-imports: the Grupo label if present,
// otherwise the members' full names. Lets us update a household (keeping its
// token/link) instead of recreating it.
function householdMatchKey(groupLabel: string, members: InviteeMember[]): string {
  const byGroup = normalizeName(groupLabel);

  if (byGroup) {
    return `g:${byGroup}`;
  }

  return `m:${normalizeName(members.map(memberFullName).join(" "))}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = formData.get("mode") === "append" ? "append" : "replace";

    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "Subí un archivo .xlsx o .csv." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json({ error: "El archivo no tiene hojas." }, { status: 400 });
    }

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      defval: "",
    });

    if (matrix.length < 2) {
      return NextResponse.json(
        { error: "El archivo no tiene filas de invitados debajo del encabezado." },
        { status: 400 },
      );
    }

    const [headerRow, ...dataRows] = matrix;
    const columns = detectColumns(headerRow.map((value) => String(value ?? "")));

    // Group rows into households. Rows sharing a "Grupo" value merge; a blank
    // group makes that person their own one-person household.
    const households = new Map<string, Household>();

    dataRows.forEach((row, index) => {
      const member = memberFromRow(row, columns);
      const memberName = memberFullName(member);

      if (!memberName) {
        return;
      }

      const groupCell = cell(row, columns.groupIdx);
      const groupKey = normalizeName(groupCell) || `__solo_${index}`;

      let household = households.get(groupKey);

      if (!household) {
        household = {
          groupLabel: groupCell,
          greeting: "",
          locale: "",
          email: "",
          whatsapp: "",
          notes: "",
          members: [],
          memberKeys: new Set<string>(),
        };
        households.set(groupKey, household);
      }

      // Dedup the same person appearing twice within a household.
      const memberKey = normalizeName(memberName);

      if (!household.memberKeys.has(memberKey)) {
        household.memberKeys.add(memberKey);
        household.members.push(member);
      }

      // Household-level fields: first non-empty value wins.
      if (!household.greeting) {
        household.greeting = cell(row, columns.greetingIdx);
      }

      if (!household.locale) {
        const localeCell = cell(row, columns.localeIdx);

        if (localeCell) {
          household.locale = parseLocale(localeCell);
        }
      }

      if (!household.email) {
        household.email = cell(row, columns.emailIdx);
      }

      if (!household.whatsapp) {
        household.whatsapp = cell(row, columns.phoneIdx);
      }

      if (!household.notes) {
        household.notes = cell(row, columns.notesIdx);
      }
    });

    if (households.size === 0) {
      return NextResponse.json(
        { error: "No encontramos nombres válidos. Revisá que haya una columna de nombre." },
        { status: 400 },
      );
    }

    // Match incoming households against existing ones by Grupo (or member names
    // when there's no group) so we can UPDATE in place and keep each token/link
    // alive across re-imports, instead of recreating.
    const existing = await prisma.invitee.findMany({
      select: { id: true, token: true, household: true, members: true },
    });

    const takenTokens = new Set<string>();
    const existingByKey = new Map<string, { id: number; key: string }>();

    existing.forEach((item) => {
      takenTokens.add(item.token);
      const key = householdMatchKey(
        item.household ?? "",
        parseJson<InviteeMember[]>(item.members, []),
      );

      if (!existingByKey.has(key)) {
        existingByKey.set(key, { id: item.id, key });
      }
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const seenKeys = new Set<string>();

    for (const household of households.values()) {
      const locale: Locale = household.locale || "es";
      const greeting =
        household.greeting ||
        joinNames(
          household.members.map((member) => member.firstName),
          locale,
        );
      const matchKey = householdMatchKey(household.groupLabel, household.members);

      // Same household appearing twice in this sheet — keep the first.
      if (seenKeys.has(matchKey)) {
        skipped += 1;
        continue;
      }

      seenKeys.add(matchKey);

      const data = {
        fullName: greeting,
        normalized: normalizeName(greeting),
        greeting,
        locale,
        members: JSON.stringify(household.members),
        household: household.groupLabel || null,
        email: household.email || null,
        whatsapp: household.whatsapp || null,
        party: household.members.length,
        notes: household.notes || null,
      };

      const match = existingByKey.get(matchKey);

      if (match) {
        // Keep the existing token/link.
        await prisma.invitee.update({ where: { id: match.id }, data });
        updated += 1;
      } else {
        await prisma.invitee.create({
          data: { ...data, token: generateUniqueToken(takenTokens) },
        });
        created += 1;
      }
    }

    // Replace mode = full sync: drop households that are no longer in the sheet.
    // Append mode leaves untouched households in place.
    let deleted = 0;

    if (mode === "replace") {
      // Never delete a household that already confirmed (protects manual adds and
      // responded guests from being wiped by a sheet that doesn't list them).
      const responded = await prisma.rsvp.findMany({
        where: { deletedAt: null, inviteeId: { not: null } },
        select: { inviteeId: true },
      });
      const respondedIds = new Set(responded.map((rsvp) => rsvp.inviteeId));

      const toDelete = existing
        .filter((item) => {
          if (respondedIds.has(item.id)) {
            return false;
          }

          const key = householdMatchKey(
            item.household ?? "",
            parseJson<InviteeMember[]>(item.members, []),
          );

          return !seenKeys.has(key);
        })
        .map((item) => item.id);

      if (toDelete.length > 0) {
        const result = await prisma.invitee.deleteMany({ where: { id: { in: toDelete } } });

        deleted = result.count;
      }
    }

    return NextResponse.json({
      imported: created + updated,
      created,
      updated,
      deleted,
      skipped,
      mode,
      detected: {
        nombre:
          columns.firstIdx >= 0 && columns.lastIdx >= 0
            ? `${columns.headers[columns.firstIdx]} + ${columns.headers[columns.lastIdx]}`
            : columns.headers[columns.combinedIdx >= 0 ? columns.combinedIdx : 0] || "Columna 1",
        grupo: columns.groupIdx >= 0 ? columns.headers[columns.groupIdx] : null,
        saludo: columns.greetingIdx >= 0 ? columns.headers[columns.greetingIdx] : null,
        idioma: columns.localeIdx >= 0 ? columns.headers[columns.localeIdx] : null,
        email: columns.emailIdx >= 0 ? columns.headers[columns.emailIdx] : null,
        whatsapp: columns.phoneIdx >= 0 ? columns.headers[columns.phoneIdx] : null,
      },
    });
  } catch (error) {
    console.error("Import invitees error", error);

    return NextResponse.json({ error: "No pudimos procesar el archivo." }, { status: 500 });
  }
}
