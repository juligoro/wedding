import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import type { Prisma } from "@prisma/client";

import { normalizeName } from "@/lib/guests";
import { prisma } from "@/lib/prisma";

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
const HOUSEHOLD_HEADERS = ["familia", "grupo", "household", "group"];
const PARTY_HEADERS = ["cantidad", "personas", "pax", "party", "cantidad de personas", "cupos"];
const NOTES_HEADERS = ["notas", "nota", "observaciones", "comentarios", "comentario"];

interface DetectedColumns {
  headers: string[];
  lastIdx: number;
  firstIdx: number;
  combinedIdx: number;
  emailIdx: number;
  phoneIdx: number;
  householdIdx: number;
  partyIdx: number;
  notesIdx: number;
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

  const lastIdx = findColumn(headers, LAST_HEADERS);
  const firstIdx = findColumn(headers, FIRST_HEADERS);
  const combinedIdx = findColumn(headers, NAME_HEADERS);

  return {
    headers: rawHeaders,
    lastIdx,
    firstIdx,
    combinedIdx,
    emailIdx: findColumn(headers, EMAIL_HEADERS),
    phoneIdx: findColumn(headers, PHONE_HEADERS),
    householdIdx: findColumn(headers, HOUSEHOLD_HEADERS),
    partyIdx: findColumn(headers, PARTY_HEADERS),
    notesIdx: findColumn(headers, NOTES_HEADERS),
  };
}

function buildName(row: unknown[], columns: DetectedColumns): string {
  if (columns.firstIdx >= 0 && columns.lastIdx >= 0) {
    return `${cell(row, columns.firstIdx)} ${cell(row, columns.lastIdx)}`.trim();
  }

  if (columns.combinedIdx >= 0) {
    return cell(row, columns.combinedIdx);
  }

  if (columns.firstIdx >= 0) {
    return cell(row, columns.firstIdx);
  }

  return cell(row, 0);
}

function parseParty(value: string): number {
  const number = Number.parseInt(value, 10);

  return Number.isInteger(number) && number > 0 ? number : 1;
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

    const seen = new Set<string>();
    const invitees: Prisma.InviteeCreateManyInput[] = [];

    dataRows.forEach((row) => {
      const fullName = buildName(row, columns);
      const normalized = normalizeName(fullName);

      if (!normalized || seen.has(normalized)) {
        return;
      }

      seen.add(normalized);
      invitees.push({
        fullName,
        normalized,
        email: cell(row, columns.emailIdx) || null,
        whatsapp: cell(row, columns.phoneIdx) || null,
        household: cell(row, columns.householdIdx) || null,
        party: parseParty(cell(row, columns.partyIdx)),
        notes: cell(row, columns.notesIdx) || null,
      });
    });

    if (invitees.length === 0) {
      return NextResponse.json(
        { error: "No encontramos nombres válidos. Revisá que haya una columna de nombre." },
        { status: 400 },
      );
    }

    let toInsert = invitees;
    let skipped = 0;

    if (mode === "replace") {
      await prisma.invitee.deleteMany({});
    } else {
      const existing = await prisma.invitee.findMany({ select: { normalized: true } });
      const existingSet = new Set(existing.map((item) => item.normalized));

      toInsert = invitees.filter((invitee) => !existingSet.has(invitee.normalized));
      skipped = invitees.length - toInsert.length;
    }

    if (toInsert.length > 0) {
      await prisma.invitee.createMany({ data: toInsert });
    }

    return NextResponse.json({
      imported: toInsert.length,
      skipped,
      mode,
      detected: {
        nombre:
          columns.firstIdx >= 0 && columns.lastIdx >= 0
            ? `${columns.headers[columns.firstIdx]} + ${columns.headers[columns.lastIdx]}`
            : columns.headers[columns.combinedIdx >= 0 ? columns.combinedIdx : 0] || "Columna 1",
        email: columns.emailIdx >= 0 ? columns.headers[columns.emailIdx] : null,
        whatsapp: columns.phoneIdx >= 0 ? columns.headers[columns.phoneIdx] : null,
        familia: columns.householdIdx >= 0 ? columns.headers[columns.householdIdx] : null,
        cantidad: columns.partyIdx >= 0 ? columns.headers[columns.partyIdx] : null,
      },
    });
  } catch (error) {
    console.error("Import invitees error", error);

    return NextResponse.json({ error: "No pudimos procesar el archivo." }, { status: 500 });
  }
}
