import { formatDate } from "./format";

import type { InviteeStatus, ReconcileItem, Row } from "../types";

export function escapeCsvValue(value: unknown): string {
  const stringValue = String(value ?? "");

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function downloadCsv(rows: Row[]): void {
  const headers = [
    "Fecha RSVP",
    "Nombres",
    "Apellidos",
    "Respuesta",
    "Comida",
    "Alergia",
    "Micro",
    "Email",
    "WhatsApp",
    "Mesa",
  ];
  const csvRows = rows.map((row) => [
    formatDate(row.submittedAt),
    row.firstName,
    row.lastName,
    row.attending ? "Confirmó" : "No viene",
    row.food,
    row.allergies,
    row.attending ? (row.needsBus ? "Sí" : "No") : "",
    row.email,
    row.whatsapp,
    row.tableName,
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "rsvp-respuestas.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadInviteesCsv(
  items: ReconcileItem[],
  filename = "invitados-sin-responder.csv",
): void {
  const headers = [
    "Nombre",
    "Grupo",
    "Email",
    "WhatsApp",
    "Personas",
    "Estado",
    "Contactado",
    "Abrió el link",
    "Último recordatorio",
  ];
  const statusLabels: Record<InviteeStatus, string> = {
    accepted: "Confirmó",
    declined: "No viene",
    pending: "Sin responder",
  };
  const csvRows = items.map((item) => [
    item.fullName,
    item.household || "",
    item.email || "",
    item.whatsapp || "",
    item.party || 1,
    statusLabels[item.status] || "Sin responder",
    item.contacted ? "Sí" : "No",
    item.firstOpenedAt ? formatDate(item.firstOpenedAt) : "No",
    item.lastRemindedAt ? formatDate(item.lastRemindedAt) : "",
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
