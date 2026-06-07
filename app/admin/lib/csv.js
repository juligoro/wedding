import { formatDate } from "./format";

export function escapeCsvValue(value) {
  const stringValue = String(value ?? "");

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function downloadCsv(rows) {
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

export function downloadInviteesCsv(items, filename = "invitados-sin-responder.csv") {
  const headers = ["Nombre", "Grupo", "Email", "WhatsApp", "Personas", "Estado", "Contactado"];
  const statusLabels = {
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
