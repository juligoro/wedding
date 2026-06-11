"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { DragEvent, FormEvent, ReactNode } from "react";

// Sobrevive a recargas y remounts (p. ej. tras router.refresh() al guardar):
// sin esto, el dashboard vuelve al Resumen después de cada acción que refresca.
const SECTION_STORAGE_KEY = "admin-active-section";

import { filterAndSortRows, getMealGroups, getRows } from "./lib/rows";
import { reconcile } from "./lib/match";
import type {
  GuestEdit,
  SerializedInvitee,
  SerializedSeatingTable,
  SerializedSubmission,
  Trash,
} from "./types";

interface InviteeEdit {
  contacted?: boolean;
  manualGuestId?: number | null;
}

interface SaveGuestFields {
  firstName?: string;
  lastName?: string;
  attending?: boolean;
  email?: string;
  whatsapp?: string;
  food?: string;
  allergies?: string;
  needsBus?: boolean;
}

interface AdminProviderProps {
  submissions: SerializedSubmission[];
  tables: SerializedSeatingTable[];
  invitees?: SerializedInvitee[];
  trash?: Trash;
  children: ReactNode;
}

type AdminProviderData = Omit<AdminProviderProps, "children">;

function useAdminValue({
  submissions,
  tables,
  invitees = [],
  trash = { rsvps: [], guests: [] },
}: AdminProviderData) {
  const router = useRouter();
  const [activeSection, setActiveSectionState] = useState("overview");

  // Restore the last visited section after a reload/remount. Runs after
  // hydration so the server-rendered HTML (Resumen) always matches.
  useEffect(() => {
    const saved = window.sessionStorage.getItem(SECTION_STORAGE_KEY);

    if (saved) {
      setActiveSectionState(saved);
    }
  }, []);

  function setActiveSection(section: string) {
    setActiveSectionState(section);

    try {
      window.sessionStorage.setItem(SECTION_STORAGE_KEY, section);
    } catch {
      // Storage unavailable (private mode, etc.) — navigation still works.
    }
  }
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");
  const [busFilter, setBusFilter] = useState("all");
  const [guestSort, setGuestSort] = useState("alpha");
  const [followSort, setFollowSort] = useState("alpha");
  const [summaryView, setSummaryView] = useState("accepted");
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);
  const [localTables, setLocalTables] = useState<SerializedSeatingTable[]>(tables);
  const [tableAssignments, setTableAssignments] = useState<Record<number, number | null>>({});
  const [guestEdits, setGuestEdits] = useState<Record<number, GuestEdit>>({});
  const [newTableName, setNewTableName] = useState("");
  const [targetTableId, setTargetTableId] = useState("");
  const [quickAddTableId, setQuickAddTableId] = useState("");
  const [tableGuestQuery, setTableGuestQuery] = useState("");
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [editingTableName, setEditingTableName] = useState("");
  const [draggedGuestId, setDraggedGuestId] = useState<number | null>(null);
  const [bulkTag, setBulkTag] = useState("");
  const [guestTags, setGuestTags] = useState<Record<number, string[]>>({});
  const [tableMessage, setTableMessage] = useState("");
  const [isSavingTables, setIsSavingTables] = useState(false);
  const [inviteeEdits, setInviteeEdits] = useState<Record<number, InviteeEdit>>({});
  const [inviteeMessage, setInviteeMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState("replace");
  const [followFilter, setFollowFilter] = useState("pending");
  const [followQuery, setFollowQuery] = useState("");
  const [crudMessage, setCrudMessage] = useState("");
  const [isReminding, setIsReminding] = useState(false);

  const rows = useMemo(
    () => getRows(submissions, tableAssignments, guestEdits),
    [submissions, tableAssignments, guestEdits],
  );
  const tableNameById = useMemo(
    () => Object.fromEntries(localTables.map((table) => [table.id, table.name])),
    [localTables],
  );
  const tableCounts = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      localTables.map((table) => [table.id, 0]),
    );

    rows.forEach((row) => {
      if (row.attending && row.tableId) {
        counts[row.tableId] = (counts[row.tableId] || 0) + 1;
      }
    });

    return counts;
  }, [localTables, rows]);

  const rowsWithTableNames = rows.map((row) => ({
    ...row,
    tableName: row.tableId ? tableNameById[row.tableId] || "" : "",
    tags: guestTags[row.id] || row.tags,
  }));
  const acceptedRows = rowsWithTableNames.filter((row) => row.attending);
  const declinedRows = rowsWithTableNames.filter((row) => !row.attending);
  const mealGroups = getMealGroups(rowsWithTableNames);
  const mealOptions = Object.keys(mealGroups);
  const selectedRow = rowsWithTableNames.find((row) => row.id === selectedRowId) || null;
  const selectedRows = rowsWithTableNames.filter((row) => selectedGuestIds.includes(row.id));
  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedRow?.submissionId) || null;
  const selectedSubmissionPeople = selectedSubmission
    ? rowsWithTableNames.filter((row) => row.submissionId === selectedSubmission.id)
    : [];
  const acceptedCount = acceptedRows.length;
  const declinedCount = declinedRows.length;
  const busCount = acceptedRows.filter((person) => person.needsBus).length;
  const unassignedRows = acceptedRows.filter((person) => !person.tableId);
  const messages = submissions.filter((submission) => submission.message?.trim());
  const localInvitees = invitees.map((invitee) => ({
    ...invitee,
    ...(inviteeEdits[invitee.id] || {}),
  }));
  const reconciliation = reconcile(localInvitees, rowsWithTableNames);
  const filteredInvitees = reconciliation.items
    .filter((item) => {
      if (followFilter === "all") {
        return true;
      }

      if (followFilter === "responded") {
        return item.status !== "pending";
      }

      if (followFilter === "uncontacted") {
        return !item.contacted;
      }

      if (followFilter === "unopened") {
        return item.status === "pending" && !item.firstOpenedAt;
      }

      return item.status === followFilter;
    })
    .filter((item) => {
      const normalizedQuery = followQuery.trim().toLowerCase();

      if (!normalizedQuery) {
        return true;
      }

      return `${item.fullName} ${item.household || ""} ${item.email || ""} ${item.whatsapp || ""}`
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((a, b) => {
      // "recent": oldest activity first, the households just edited or
      // reminded land at the bottom.
      if (followSort === "recent") {
        return a.updatedAt === b.updatedAt
          ? a.fullName.localeCompare(b.fullName)
          : a.updatedAt < b.updatedAt
            ? -1
            : 1;
      }

      return a.fullName.localeCompare(b.fullName);
    });
  const pendingInvitees = reconciliation.items.filter((item) => item.status === "pending");
  const acceptedPercent =
    acceptedCount + declinedCount > 0
      ? Math.round((acceptedCount / (acceptedCount + declinedCount)) * 100)
      : 0;
  const quickAddCandidates = tableGuestQuery.trim()
    ? acceptedRows
        .filter((row) =>
          `${row.name} ${row.food} ${row.tableName}`
            .toLowerCase()
            .includes(tableGuestQuery.trim().toLowerCase()),
        )
        .slice(0, 8)
    : [];

  const filteredRows = filterAndSortRows(rowsWithTableNames, {
    query,
    statusFilter,
    mealFilter,
    busFilter,
    sort: guestSort,
  });
  const summaryNames = summaryView === "accepted" ? acceptedRows : declinedRows;
  const selectedVisibleGuestIds = filteredRows
    .filter((row) => row.attending)
    .map((row) => row.id);
  const allVisibleSelected =
    selectedVisibleGuestIds.length > 0 &&
    selectedVisibleGuestIds.every((guestId) => selectedGuestIds.includes(guestId));

  function getTableById(tableId: number | string | null): SerializedSeatingTable | null {
    return localTables.find((table) => table.id === Number(tableId)) || null;
  }

  function getSeatsNeeded(tableId: number | string | null, guestIds: number[]): number {
    return guestIds.filter((guestId) => {
      const row = rowsWithTableNames.find((person) => person.id === Number(guestId));

      return row?.attending && row.tableId !== Number(tableId);
    }).length;
  }

  function canAssignToTable(
    tableId: number | string | null,
    guestIds: number[] = selectedGuestIds,
  ): boolean {
    if (tableId === null || guestIds.length === 0) {
      return true;
    }

    const table = getTableById(tableId);

    if (!table) {
      return false;
    }

    return (tableCounts[table.id] || 0) + getSeatsNeeded(table.id, guestIds) <= table.capacity;
  }

  function getCapacityMessage(tableId: number | string | null): string {
    const table = getTableById(tableId);

    if (!table) {
      return "Mesa inválida.";
    }

    return `La mesa ${table.name} admite hasta ${table.capacity} personas.`;
  }

  function toggleGuest(guestId: number) {
    setSelectedGuestIds((current) =>
      current.includes(guestId) ? current.filter((id) => id !== guestId) : [...current, guestId],
    );
  }

  function toggleVisibleGuests() {
    setSelectedGuestIds((current) => {
      if (allVisibleSelected) {
        return current.filter((guestId) => !selectedVisibleGuestIds.includes(guestId));
      }

      return Array.from(new Set([...current, ...selectedVisibleGuestIds]));
    });
  }

  async function copySelected(field: "email" | "whatsapp") {
    const values = Array.from(new Set(selectedRows.map((row) => row[field]).filter(Boolean)));

    if (values.length === 0) {
      setTableMessage("No hay datos para copiar en la selección.");
      return;
    }

    try {
      await navigator.clipboard.writeText(values.join("\n"));
      setTableMessage(field === "email" ? "Emails copiados." : "WhatsApps copiados.");
    } catch {
      setTableMessage("No pudimos copiar al portapapeles.");
    }
  }

  function selectUnassignedGuests() {
    setSelectedGuestIds(unassignedRows.map((row) => row.id));
    setActiveSection("seating");
    setTableMessage(`${unassignedRows.length} invitados sin mesa seleccionados.`);
  }

  async function createTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingTables(true);
    setTableMessage("");

    try {
      const response = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTableName }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos crear la mesa.");
      }

      setLocalTables((current) => [...current, { ...body.table, guests: [] }]);
      setTargetTableId(String(body.table.id));
      setQuickAddTableId(String(body.table.id));
      setNewTableName("");
      setTableMessage(`Mesa ${body.table.name} creada.`);
    } catch (error) {
      setTableMessage(error instanceof Error ? error.message : "No pudimos crear la mesa.");
    } finally {
      setIsSavingTables(false);
    }
  }

  async function assignGuests(
    tableId: number | string | null,
    guestIds: number[] = selectedGuestIds,
  ) {
    const uniqueGuestIds = Array.from(new Set(guestIds.map(Number).filter(Number.isInteger)));

    if (uniqueGuestIds.length === 0) {
      setTableMessage("Seleccioná al menos un invitado confirmado.");
      return;
    }

    if (!canAssignToTable(tableId, uniqueGuestIds)) {
      setTableMessage(getCapacityMessage(tableId));
      return;
    }

    setIsSavingTables(true);
    setTableMessage("");

    try {
      const numericTableId = tableId === null ? null : Number(tableId);
      const response = await fetch("/api/admin/guests/assign-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: uniqueGuestIds, tableId: numericTableId }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos asignar la mesa.");
      }

      setTableAssignments((current) => {
        const next = { ...current };

        uniqueGuestIds.forEach((guestId) => {
          next[guestId] = numericTableId;
        });

        return next;
      });
      setSelectedGuestIds((current) =>
        current.filter((guestId) => !uniqueGuestIds.includes(guestId)),
      );
      setTableGuestQuery("");
      setTableMessage(numericTableId ? "Mesa asignada." : "Invitados desasignados.");
    } catch (error) {
      setTableMessage(error instanceof Error ? error.message : "No pudimos asignar la mesa.");
    } finally {
      setIsSavingTables(false);
    }
  }

  async function renameTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTableId) {
      return;
    }

    setIsSavingTables(true);
    setTableMessage("");

    try {
      const response = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingTableId, name: editingTableName }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos actualizar la mesa.");
      }

      setLocalTables((current) =>
        current.map((table) =>
          table.id === body.table.id ? { ...table, name: body.table.name } : table,
        ),
      );
      setEditingTableId(null);
      setEditingTableName("");
      setTableMessage(`Mesa ${body.table.name} actualizada.`);
    } catch (error) {
      setTableMessage(error instanceof Error ? error.message : "No pudimos actualizar la mesa.");
    } finally {
      setIsSavingTables(false);
    }
  }

  function startEditingTable(table: SerializedSeatingTable) {
    setEditingTableId(table.id);
    setEditingTableName(table.name);
  }

  function handleGuestDrop(event: DragEvent<HTMLElement>, tableId: number | string | null) {
    event.preventDefault();
    const rawGuestId = event.dataTransfer.getData("text/plain") || draggedGuestId;
    const guestId = rawGuestId ? Number(rawGuestId) : NaN;

    setDraggedGuestId(null);

    if (!Number.isInteger(guestId)) {
      return;
    }

    if (!canAssignToTable(tableId, [guestId])) {
      setTableMessage(getCapacityMessage(tableId));
      return;
    }

    assignGuests(tableId, [guestId]);
  }

  async function addTagToSelected() {
    if (selectedGuestIds.length === 0) {
      setTableMessage("Seleccioná al menos un invitado.");
      return;
    }

    const tag = bulkTag.trim();

    if (!tag) {
      setTableMessage("Escribí un tag.");
      return;
    }

    setIsSavingTables(true);
    setTableMessage("");

    try {
      const response = await fetch("/api/admin/guests/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds: selectedGuestIds, tag }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos agregar el tag.");
      }

      setGuestTags((current) => {
        const next = { ...current };

        selectedRows.forEach((row) => {
          next[row.id] = Array.from(new Set([...(next[row.id] || row.tags), tag]));
        });

        return next;
      });
      setBulkTag("");
      setTableMessage(`Tag "${tag}" agregado.`);
    } catch (error) {
      setTableMessage(error instanceof Error ? error.message : "No pudimos agregar el tag.");
    } finally {
      setIsSavingTables(false);
    }
  }

  async function saveGuest(guestId: number, fields: SaveGuestFields): Promise<boolean> {
    const firstName = (fields.firstName || "").trim();

    if (!firstName) {
      setTableMessage("El nombre no puede quedar vacío.");
      return false;
    }

    const lastName = (fields.lastName || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const attending = typeof fields.attending === "boolean" ? fields.attending : undefined;
    const email = (fields.email || "").trim();
    const whatsapp = (fields.whatsapp || "").trim();
    const food = attending === false ? "" : (fields.food || "").trim();
    const allergies = attending === false ? "" : (fields.allergies || "").trim();
    const needsBus =
      attending === false ? null : typeof fields.needsBus === "boolean" ? fields.needsBus : null;

    setIsSavingTables(true);
    setTableMessage("");

    try {
      const payload: {
        id: number;
        firstName: string;
        lastName: string;
        food: string;
        allergies: string;
        needsBus: boolean | null;
        attending?: boolean;
        email?: string;
        whatsapp?: string;
      } = { id: guestId, firstName, lastName, food, allergies, needsBus };

      if (attending !== undefined) {
        payload.attending = attending;
      }
      if (email) {
        payload.email = email;
      }
      if (whatsapp) {
        payload.whatsapp = whatsapp;
      }

      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos actualizar al invitado.");
      }

      setGuestEdits((current) => ({
        ...current,
        [guestId]: {
          firstName,
          lastName,
          fullName,
          food,
          allergies,
          needsBus,
          ...(attending !== undefined ? { attending } : {}),
          ...(email ? { email } : {}),
          ...(whatsapp ? { whatsapp } : {}),
        },
      }));
      setTableMessage("Invitado actualizado.");
      router.refresh();
      return true;
    } catch (error) {
      setTableMessage(error instanceof Error ? error.message : "No pudimos actualizar al invitado.");
      return false;
    } finally {
      setIsSavingTables(false);
    }
  }

  async function runCrud(
    url: string,
    options: RequestInit,
    successMessage: string,
  ): Promise<boolean> {
    setCrudMessage("");

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));

        throw new Error(body.error || "No pudimos completar la acción.");
      }

      setCrudMessage(successMessage);
      router.refresh();
      return true;
    } catch (error) {
      setCrudMessage(error instanceof Error ? error.message : "No pudimos completar la acción.");
      return false;
    }
  }

  function jsonBody(payload: unknown) {
    return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };
  }

  async function softDeleteGuest(guestId: number) {
    if (selectedRowId === guestId) {
      setSelectedRowId(null);
    }

    return runCrud(
      "/api/admin/guests",
      { method: "DELETE", ...jsonBody({ id: guestId }) },
      "Invitado movido a la papelera.",
    );
  }

  async function softDeleteRsvp(rsvpId: number, { closeDrawer = true }: { closeDrawer?: boolean } = {}) {
    if (closeDrawer) {
      setSelectedRowId(null);
    }

    return runCrud(
      "/api/admin/rsvps",
      { method: "DELETE", ...jsonBody({ id: rsvpId }) },
      "Envío movido a la papelera.",
    );
  }

  async function restoreGuest(guestId: number) {
    return runCrud(
      "/api/admin/guests",
      { method: "PATCH", ...jsonBody({ id: guestId, action: "restore" }) },
      "Invitado restaurado.",
    );
  }

  async function restoreRsvp(rsvpId: number) {
    return runCrud(
      "/api/admin/rsvps",
      { method: "PATCH", ...jsonBody({ id: rsvpId, action: "restore" }) },
      "Envío restaurado.",
    );
  }

  async function purgeGuest(guestId: number) {
    return runCrud(
      "/api/admin/guests",
      { method: "DELETE", ...jsonBody({ id: guestId, permanent: true }) },
      "Invitado eliminado definitivamente.",
    );
  }

  async function purgeRsvp(rsvpId: number) {
    return runCrud(
      "/api/admin/rsvps",
      { method: "DELETE", ...jsonBody({ id: rsvpId, permanent: true }) },
      "Envío eliminado definitivamente.",
    );
  }

  async function softDeleteSelected() {
    const ids = Array.from(new Set(selectedGuestIds.map(Number).filter(Number.isInteger)));

    if (ids.length === 0) {
      setTableMessage("Seleccioná al menos un invitado.");
      return false;
    }

    const ok = await runCrud(
      "/api/admin/guests",
      { method: "DELETE", ...jsonBody({ ids }) },
      `${ids.length} invitado(s) movidos a la papelera.`,
    );

    if (ok) {
      setTableMessage(`${ids.length} invitado(s) movidos a la papelera.`);

      if (selectedRowId !== null && ids.includes(selectedRowId)) {
        setSelectedRowId(null);
      }

      setSelectedGuestIds([]);
    }

    return ok;
  }

  async function importInvitees(file: File | null | undefined) {
    if (!file) {
      setInviteeMessage("Elegí un archivo .xlsx o .csv.");
      return;
    }

    setIsImporting(true);
    setInviteeMessage("");

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("mode", importMode);

      const response = await fetch("/api/admin/invitees/import", {
        method: "POST",
        body: formData,
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos procesar el archivo.");
      }

      setInviteeEdits({});
      const detected = body.detected?.nombre ? ` Columna de nombre: ${body.detected.nombre}.` : "";
      const parts = [
        body.created ? `${body.created} hogares nuevos` : "",
        body.updated ? `${body.updated} actualizados` : "",
        body.deleted ? `${body.deleted} eliminados` : "",
        body.skipped ? `${body.skipped} repetidos en la planilla` : "",
      ].filter(Boolean);
      const summary = parts.length > 0 ? parts.join(" · ") : "Sin cambios";

      setInviteeMessage(`${summary}.${detected}`);
      router.refresh();
    } catch (error) {
      setInviteeMessage(error instanceof Error ? error.message : "No pudimos procesar el archivo.");
    } finally {
      setIsImporting(false);
    }
  }

  async function patchInvitee(id: number, fields: InviteeEdit) {
    setInviteeEdits((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), ...fields },
    }));

    try {
      const response = await fetch("/api/admin/invitees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });

      if (!response.ok) {
        const body = await response.json();

        throw new Error(body.error || "No pudimos actualizar al invitado.");
      }
    } catch (error) {
      setInviteeMessage(error instanceof Error ? error.message : "No pudimos actualizar al invitado.");
      router.refresh();
    }
  }

  function toggleContacted(id: number, contacted: boolean) {
    patchInvitee(id, { contacted });
  }

  async function sendReminders(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      setInviteeMessage("No hay hogares pendientes con email.");
      return;
    }

    setIsReminding(true);
    setInviteeMessage("");

    try {
      const response = await fetch("/api/admin/invitees/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos enviar los recordatorios.");
      }

      const parts = [
        `Recordatorios enviados: ${body.sent ?? 0}`,
        body.failed ? `fallaron: ${body.failed}` : "",
        body.skippedNoEmail ? `sin email: ${body.skippedNoEmail}` : "",
        body.skippedResponded ? `ya respondieron: ${body.skippedResponded}` : "",
      ].filter(Boolean);

      setInviteeMessage(`${parts.join(" · ")}.`);
      router.refresh();
    } catch (error) {
      setInviteeMessage(
        error instanceof Error ? error.message : "No pudimos enviar los recordatorios.",
      );
    } finally {
      setIsReminding(false);
    }
  }

  function setManualMatch(id: number, manualGuestId: number | string | null) {
    patchInvitee(id, { manualGuestId: manualGuestId ? Number(manualGuestId) : null });
  }

  async function clearInvitees() {
    setIsImporting(true);
    setInviteeMessage("");

    try {
      const response = await fetch("/api/admin/invitees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      if (!response.ok) {
        const body = await response.json();

        throw new Error(body.error || "No pudimos vaciar la lista.");
      }

      setInviteeEdits({});
      setInviteeMessage("Lista vaciada.");
      router.refresh();
    } catch (error) {
      setInviteeMessage(error instanceof Error ? error.message : "No pudimos vaciar la lista.");
    } finally {
      setIsImporting(false);
    }
  }

  async function addInvitee(payload: {
    members: { firstName: string; lastName: string }[];
    greeting?: string;
    locale?: string;
    email?: string;
    whatsapp?: string;
    household?: string;
  }): Promise<boolean> {
    setIsImporting(true);
    setInviteeMessage("");

    try {
      const response = await fetch("/api/admin/invitees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos agregar el hogar.");
      }

      setInviteeMessage(`Hogar agregado: ${body.invitee?.greeting || "listo"}.`);
      router.refresh();

      return true;
    } catch (error) {
      setInviteeMessage(error instanceof Error ? error.message : "No pudimos agregar el hogar.");

      return false;
    } finally {
      setIsImporting(false);
    }
  }

  async function saveInvitee(
    id: number,
    payload: {
      members: { firstName: string; lastName: string }[];
      greeting?: string;
      locale?: string;
      email?: string;
      whatsapp?: string;
      household?: string;
    },
  ): Promise<boolean> {
    setIsImporting(true);
    setInviteeMessage("");

    try {
      const response = await fetch("/api/admin/invitees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos guardar el hogar.");
      }

      setInviteeMessage("Hogar actualizado.");
      router.refresh();

      return true;
    } catch (error) {
      setInviteeMessage(error instanceof Error ? error.message : "No pudimos guardar el hogar.");

      return false;
    } finally {
      setIsImporting(false);
    }
  }

  const value = {
    submissions,
    // sections
    activeSection,
    setActiveSection,
    // filters
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    mealFilter,
    setMealFilter,
    busFilter,
    setBusFilter,
    guestSort,
    setGuestSort,
    summaryView,
    setSummaryView,
    // selection + drawer
    selectedRowId,
    setSelectedRowId,
    selectedGuestIds,
    setSelectedGuestIds,
    // tables editing state
    localTables,
    newTableName,
    setNewTableName,
    targetTableId,
    setTargetTableId,
    quickAddTableId,
    setQuickAddTableId,
    tableGuestQuery,
    setTableGuestQuery,
    editingTableId,
    setEditingTableId,
    editingTableName,
    setEditingTableName,
    draggedGuestId,
    setDraggedGuestId,
    bulkTag,
    setBulkTag,
    tableMessage,
    setTableMessage,
    isSavingTables,
    // invitee follow-up
    reconciliation,
    filteredInvitees,
    pendingInvitees,
    inviteeMessage,
    setInviteeMessage,
    isImporting,
    importMode,
    setImportMode,
    followFilter,
    setFollowFilter,
    followQuery,
    setFollowQuery,
    followSort,
    setFollowSort,
    importInvitees,
    addInvitee,
    saveInvitee,
    toggleContacted,
    setManualMatch,
    clearInvitees,
    sendReminders,
    isReminding,
    // trash / crud
    trash,
    trashCount: trash.rsvps.length + trash.guests.length,
    crudMessage,
    setCrudMessage,
    softDeleteGuest,
    softDeleteRsvp,
    restoreGuest,
    restoreRsvp,
    purgeGuest,
    purgeRsvp,
    softDeleteSelected,
    // derived
    rowsWithTableNames,
    acceptedRows,
    declinedRows,
    mealGroups,
    mealOptions,
    selectedRow,
    selectedRows,
    selectedSubmission,
    selectedSubmissionPeople,
    acceptedCount,
    declinedCount,
    busCount,
    unassignedRows,
    messages,
    acceptedPercent,
    quickAddCandidates,
    filteredRows,
    summaryNames,
    tableCounts,
    allVisibleSelected,
    // handlers
    canAssignToTable,
    toggleGuest,
    toggleVisibleGuests,
    copySelected,
    selectUnassignedGuests,
    createTable,
    assignGuests,
    renameTable,
    startEditingTable,
    handleGuestDrop,
    addTagToSelected,
    saveGuest,
  };

  return value;
}

export type AdminContextValue = ReturnType<typeof useAdminValue>;

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const value = useContext(AdminContext);

  if (!value) {
    throw new Error("useAdmin must be used inside <AdminProvider>");
  }

  return value;
}

export function AdminProvider({ children, ...props }: AdminProviderProps) {
  const value = useAdminValue(props);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
