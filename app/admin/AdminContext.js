"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { filterAndSortRows, getMealGroups, getRows } from "./lib/rows";

const AdminContext = createContext(null);

export function useAdmin() {
  const value = useContext(AdminContext);

  if (!value) {
    throw new Error("useAdmin must be used inside <AdminProvider>");
  }

  return value;
}

export function AdminProvider({ submissions, tables, children }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");
  const [busFilter, setBusFilter] = useState("all");
  const [summaryView, setSummaryView] = useState("accepted");
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState([]);
  const [localTables, setLocalTables] = useState(tables);
  const [tableAssignments, setTableAssignments] = useState({});
  const [guestEdits, setGuestEdits] = useState({});
  const [newTableName, setNewTableName] = useState("");
  const [targetTableId, setTargetTableId] = useState("");
  const [quickAddTableId, setQuickAddTableId] = useState("");
  const [tableGuestQuery, setTableGuestQuery] = useState("");
  const [editingTableId, setEditingTableId] = useState(null);
  const [editingTableName, setEditingTableName] = useState("");
  const [draggedGuestId, setDraggedGuestId] = useState(null);
  const [bulkTag, setBulkTag] = useState("");
  const [guestTags, setGuestTags] = useState({});
  const [tableMessage, setTableMessage] = useState("");
  const [isSavingTables, setIsSavingTables] = useState(false);

  const rows = useMemo(
    () => getRows(submissions, tableAssignments, guestEdits),
    [submissions, tableAssignments, guestEdits],
  );
  const tableNameById = useMemo(
    () => Object.fromEntries(localTables.map((table) => [table.id, table.name])),
    [localTables],
  );
  const tableCounts = useMemo(() => {
    const counts = Object.fromEntries(localTables.map((table) => [table.id, 0]));

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
  });
  const summaryNames = summaryView === "accepted" ? acceptedRows : declinedRows;
  const selectedVisibleGuestIds = filteredRows
    .filter((row) => row.attending)
    .map((row) => row.id);
  const allVisibleSelected =
    selectedVisibleGuestIds.length > 0 &&
    selectedVisibleGuestIds.every((guestId) => selectedGuestIds.includes(guestId));

  function getTableById(tableId) {
    return localTables.find((table) => table.id === Number(tableId)) || null;
  }

  function getSeatsNeeded(tableId, guestIds) {
    return guestIds.filter((guestId) => {
      const row = rowsWithTableNames.find((person) => person.id === Number(guestId));

      return row?.attending && row.tableId !== Number(tableId);
    }).length;
  }

  function canAssignToTable(tableId, guestIds = selectedGuestIds) {
    if (tableId === null || guestIds.length === 0) {
      return true;
    }

    const table = getTableById(tableId);

    if (!table) {
      return false;
    }

    return (tableCounts[table.id] || 0) + getSeatsNeeded(table.id, guestIds) <= table.capacity;
  }

  function getCapacityMessage(tableId) {
    const table = getTableById(tableId);

    if (!table) {
      return "Mesa inválida.";
    }

    return `La mesa ${table.name} admite hasta ${table.capacity} personas.`;
  }

  function toggleGuest(guestId) {
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

  async function copySelected(field) {
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

  async function createTable(event) {
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
      setTableMessage(error.message);
    } finally {
      setIsSavingTables(false);
    }
  }

  async function assignGuests(tableId, guestIds = selectedGuestIds) {
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
      setTableMessage(error.message);
    } finally {
      setIsSavingTables(false);
    }
  }

  async function renameTable(event) {
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
      setTableMessage(error.message);
    } finally {
      setIsSavingTables(false);
    }
  }

  function startEditingTable(table) {
    setEditingTableId(table.id);
    setEditingTableName(table.name);
  }

  function handleGuestDrop(event, tableId) {
    event.preventDefault();
    const rawGuestId = event.dataTransfer.getData("text/plain") || draggedGuestId;
    const guestId = rawGuestId ? Number(rawGuestId) : null;

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
      setTableMessage(error.message);
    } finally {
      setIsSavingTables(false);
    }
  }

  async function saveGuest(guestId, fields) {
    const firstName = (fields.firstName || "").trim();

    if (!firstName) {
      setTableMessage("El nombre no puede quedar vacío.");
      return false;
    }

    const lastName = (fields.lastName || "").trim();
    const food = (fields.food || "").trim();
    const allergies = (fields.allergies || "").trim();
    const needsBus = typeof fields.needsBus === "boolean" ? fields.needsBus : null;
    const fullName = `${firstName} ${lastName}`.trim();

    setIsSavingTables(true);
    setTableMessage("");

    try {
      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: guestId, firstName, lastName, food, allergies, needsBus }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos actualizar al invitado.");
      }

      setGuestEdits((current) => ({
        ...current,
        [guestId]: { firstName, lastName, fullName, food, allergies, needsBus },
      }));
      setTableMessage("Invitado actualizado.");
      return true;
    } catch (error) {
      setTableMessage(error.message);
      return false;
    } finally {
      setIsSavingTables(false);
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

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
