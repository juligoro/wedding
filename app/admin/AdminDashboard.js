"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function formatDate(date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function downloadCsv(rows) {
  const headers = [
    "RSVP Date",
    "Nombres",
    "Apellidos",
    "Respuesta",
    "Food",
    "Alergia",
    "Micro",
    "Mail",
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
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "rsvp-respuestas.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function getRows(submissions, tableAssignments) {
  return submissions.flatMap((submission) =>
    submission.guests.map((guest) => {
      const tableId = tableAssignments[guest.id] ?? guest.tableId;

      return {
        id: guest.id,
        submissionId: submission.id,
        firstName: guest.firstName,
        lastName: guest.lastName || "",
        name: guest.fullName,
        food: guest.food || "",
        role: guest.role,
        needsBus: guest.needsBus,
        allergies: guest.allergies || "",
        email: guest.email,
        whatsapp: guest.whatsapp,
        tags: parseJson(guest.tags, []),
        submittedBy: `${submission.firstName} ${submission.lastName}`,
        submittedAt: submission.createdAt,
        attending: guest.attending,
        tableId,
        tableName: guest.table?.id === tableId ? guest.table.name : "",
      };
    }),
  );
}

function getMealGroups(rows) {
  return rows
    .filter((row) => row.attending)
    .reduce((groups, person) => {
      const key = person.food || "Ninguna";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(person);

      return groups;
    }, {});
}

export default function AdminDashboard({ submissions, tables }) {
  const tablesPanelRef = useRef(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");
  const [busFilter, setBusFilter] = useState("all");
  const [summaryView, setSummaryView] = useState("accepted");
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [showTables, setShowTables] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState([]);
  const [localTables, setLocalTables] = useState(tables);
  const [tableAssignments, setTableAssignments] = useState({});
  const [newTableName, setNewTableName] = useState("");
  const [targetTableId, setTargetTableId] = useState("");
  const [editingTableId, setEditingTableId] = useState(null);
  const [editingTableName, setEditingTableName] = useState("");
  const [draggedGuestId, setDraggedGuestId] = useState(null);
  const [bulkTag, setBulkTag] = useState("");
  const [guestTags, setGuestTags] = useState({});
  const [tableMessage, setTableMessage] = useState("");
  const [isSavingTables, setIsSavingTables] = useState(false);

  const rows = useMemo(() => getRows(submissions, tableAssignments), [submissions, tableAssignments]);
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

  const filteredRows = rowsWithTableNames
    .filter((row) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery = normalizedQuery
        ? `${row.name} ${row.submittedBy} ${row.food} ${row.email} ${row.whatsapp} ${row.tableName} ${row.tags.join(" ")}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "accepted" && row.attending) ||
        (statusFilter === "declined" && !row.attending);
      const matchesMeal = mealFilter === "all" || row.food === mealFilter;
      const matchesBus =
        busFilter === "all" ||
        (busFilter === "yes" && row.needsBus) ||
        (busFilter === "no" && !row.needsBus);

      return matchesQuery && matchesStatus && matchesMeal && matchesBus;
    })
    .sort((a, b) => {
      if (a.attending !== b.attending) {
        return a.attending ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

  const summaryNames = summaryView === "accepted" ? acceptedRows : declinedRows;
  const selectedVisibleGuestIds = filteredRows
    .filter((row) => row.attending)
    .map((row) => row.id);
  const allVisibleSelected =
    selectedVisibleGuestIds.length > 0 &&
    selectedVisibleGuestIds.every((guestId) => selectedGuestIds.includes(guestId));

  useEffect(() => {
    if (!showTables) {
      return;
    }

    requestAnimationFrame(() => {
      tablesPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [showTables]);

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
    setShowTables(true);
    setTableMessage(`${unassignedRows.length} invitados sin mesa seleccionados.`);
  }

  async function createTable(event) {
    event.preventDefault();
    setIsSavingTables(true);
    setTableMessage("");

    try {
      const response = await fetch("/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newTableName }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos crear la mesa.");
      }

      setLocalTables((current) => [...current, { ...body.table, guests: [] }]);
      setTargetTableId(String(body.table.id));
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestIds: uniqueGuestIds,
          tableId: numericTableId,
        }),
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
      setSelectedGuestIds((current) => current.filter((guestId) => !uniqueGuestIds.includes(guestId)));
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingTableId,
          name: editingTableName,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "No pudimos actualizar la mesa.");
      }

      setLocalTables((current) =>
        current.map((table) => (table.id === body.table.id ? { ...table, name: body.table.name } : table)),
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestIds: selectedGuestIds,
          tag,
        }),
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

  return (
    <main className={selectedRow ? "admin-dashboard has-detail" : "admin-dashboard"}>
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Panel privado</p>
            <h1>RSVP Dashboard</h1>
          </div>
          <div className="dashboard-header-actions">
            <button
              className={showTables ? "secondary-dashboard-button active" : "secondary-dashboard-button"}
              type="button"
              onClick={() => setShowTables((current) => !current)}
            >
              Mesas
            </button>
            <button className="download-button" type="button" onClick={() => downloadCsv(rowsWithTableNames)}>
              Descargar CSV
            </button>
            <button
              className="secondary-dashboard-button"
              type="button"
              onClick={() => {
                fetch("/api/admin/logout", { method: "POST" }).finally(() => {
                  window.location.href = "/admin/login";
                });
              }}
            >
              Salir
            </button>
          </div>
        </header>

        <section className="dashboard-toolbar" aria-label="Filtros">
          <label className="search-shell">
            <span>Buscar</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre"
            />
          </label>
          <div className="filter-row">
            <label>
              Estado
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="accepted">Confirmados</option>
                <option value="declined">No confirmados</option>
              </select>
            </label>
            <label>
              Comida
              <select value={mealFilter} onChange={(event) => setMealFilter(event.target.value)}>
                <option value="all">Todas</option>
                {mealOptions.map((meal) => (
                  <option key={meal} value={meal}>
                    {meal}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Micro
              <select value={busFilter} onChange={(event) => setBusFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        </section>

        <section className="dashboard-summary" aria-label="Resumen">
          <button
            className={summaryView === "accepted" ? "summary-card primary active" : "summary-card primary"}
            type="button"
            onClick={() => setSummaryView("accepted")}
          >
            <div className="donut" style={{ "--value": `${acceptedPercent}%` }} />
            <div>
              <h2>Confirmados</h2>
              <strong>{acceptedCount}</strong>
              <p>Incluye titulares y acompañantes</p>
            </div>
          </button>

          <button
            className={summaryView === "declined" ? "summary-card primary active" : "summary-card primary"}
            type="button"
            onClick={() => setSummaryView("declined")}
          >
            <div className="decline-mark">{declinedCount}</div>
            <div>
              <h2>No confirmados</h2>
              <strong>{declinedCount}</strong>
              <p>Personas que respondieron que no</p>
            </div>
          </button>

          <article className="summary-card meal-summary">
            <h2>Comidas</h2>
            {Object.entries(mealGroups).length > 0 ? (
              <ul>
                {Object.entries(mealGroups).map(([meal, names]) => (
                  <li key={meal}>
                    <button type="button" onClick={() => setMealFilter(meal)}>
                      <span>{meal}</span>
                      <strong>{names.length}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sin platos cargados</p>
            )}
          </article>
        </section>

        <section className="summary-names-panel">
          <div className="table-heading">
            <h2>{summaryView === "accepted" ? "Quiénes confirmaron" : "Quiénes no vienen"}</h2>
            <span>{summaryNames.length} nombres</span>
          </div>
          {summaryNames.length > 0 ? (
            <div className="name-chip-list">
              {summaryNames.map((row) => (
                <button
                  className={row.id === selectedRowId ? "name-chip active" : "name-chip"}
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedRowId(row.id)}
                >
                  {row.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Todavía no hay respuestas para esta categoría.</p>
          )}
        </section>

        <section className="dashboard-table-panel">
          <div className="table-heading">
            <h2>Respuestas filtradas</h2>
            <span>
              {filteredRows.length} de {rowsWithTableNames.length}
            </span>
          </div>

          {selectedGuestIds.length > 0 ? (
            <div className="bulk-action-bar" role="region" aria-label="Acciones en lote">
              <strong>{selectedGuestIds.length} seleccionados</strong>
              <select value={targetTableId} onChange={(event) => setTargetTableId(event.target.value)}>
                <option value="">Elegir mesa</option>
                {localTables.map((table) => (
                  <option
                    key={table.id}
                    value={table.id}
                    disabled={!canAssignToTable(table.id, selectedGuestIds)}
                  >
                    {table.name} ({tableCounts[table.id] || 0}/{table.capacity})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!targetTableId || isSavingTables || !canAssignToTable(targetTableId, selectedGuestIds)}
                onClick={() => assignGuests(targetTableId)}
              >
                A mesa
              </button>
              <button type="button" disabled={isSavingTables} onClick={() => assignGuests(null)}>
                Sin mesa
              </button>
              <button type="button" onClick={() => downloadCsv(selectedRows)}>
                CSV
              </button>
              <button type="button" onClick={() => copySelected("email")}>
                Emails
              </button>
              <button type="button" onClick={() => copySelected("whatsapp")}>
                WhatsApps
              </button>
              <input
                className="bulk-tag-input"
                value={bulkTag}
                onChange={(event) => setBulkTag(event.target.value)}
                placeholder="Tag"
              />
              <button type="button" disabled={isSavingTables} onClick={addTagToSelected}>
                Tag
              </button>
              <button type="button" disabled>
                Correo
              </button>
              <button type="button" disabled>
                Editar
              </button>
              <button type="button" onClick={() => setSelectedGuestIds([])}>
                Limpiar
              </button>
            </div>
          ) : (
            <div className="bulk-action-hint">
              <button type="button" onClick={selectUnassignedGuests}>
                Seleccionar sin mesa ({unassignedRows.length})
              </button>
            </div>
          )}

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleGuests}
                      aria-label="Seleccionar confirmados visibles"
                    />
                  </th>
                  <th>First name</th>
                  <th>Last name</th>
                  <th>Answer</th>
                  <th>Food selection</th>
                  <th>Alergia</th>
                  <th>Micro</th>
                  <th>Mail</th>
                  <th>WhatsApp</th>
                  <th>Mesa</th>
                  <th>Tags</th>
                  <th>RSVP date</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr className={row.id === selectedRowId ? "is-selected" : ""} key={row.id}>
                    <td>
                      {row.attending ? (
                        <input
                          type="checkbox"
                          checked={selectedGuestIds.includes(row.id)}
                          onChange={() => toggleGuest(row.id)}
                          aria-label={`Seleccionar ${row.name}`}
                        />
                      ) : null}
                    </td>
                    <td>{row.firstName}</td>
                    <td>{row.lastName || "-"}</td>
                    <td>
                      <span className={row.attending ? "answer accept" : "answer decline"}>
                        {row.attending ? "Confirmó" : "No viene"}
                      </span>
                    </td>
                    <td>{row.food || "-"}</td>
                    <td>{row.allergies || ""}</td>
                    <td>{row.attending ? (row.needsBus ? "Sí" : "No") : "-"}</td>
                    <td>{row.email}</td>
                    <td>{row.whatsapp}</td>
                    <td>{row.tableName || (row.attending ? "Sin mesa" : "-")}</td>
                    <td>
                      {row.tags.length > 0 ? (
                        <span className="tag-list">{row.tags.join(", ")}</span>
                      ) : null}
                    </td>
                    <td>{formatDate(row.submittedAt)}</td>
                    <td>
                      <button
                        className="details-link"
                        type="button"
                        onClick={() => setSelectedRowId(row.id)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 ? (
            <p className="dashboard-empty">No hay respuestas que coincidan con esos filtros.</p>
          ) : null}
        </section>

        {showTables ? (
          <section className="tables-panel" ref={tablesPanelRef}>
            <div className="table-heading">
              <h2>Mesas</h2>
              <span>{unassignedRows.length} confirmados sin mesa</span>
            </div>

            <form className="table-create-row" onSubmit={createTable}>
              <input
                value={newTableName}
                onChange={(event) => setNewTableName(event.target.value)}
                placeholder="Nombre de mesa"
              />
              <button type="submit" disabled={isSavingTables}>
                Crear mesa
              </button>
            </form>

            <div className="bulk-assign-row">
              <strong>{selectedGuestIds.length} seleccionados</strong>
              <select value={targetTableId} onChange={(event) => setTargetTableId(event.target.value)}>
                <option value="">Elegir mesa</option>
                {localTables.map((table) => (
                  <option
                    key={table.id}
                    value={table.id}
                    disabled={!canAssignToTable(table.id, selectedGuestIds)}
                  >
                    {table.name} ({tableCounts[table.id] || 0}/{table.capacity})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!targetTableId || isSavingTables || !canAssignToTable(targetTableId, selectedGuestIds)}
                onClick={() => assignGuests(targetTableId)}
              >
                Asignar
              </button>
              <button type="button" disabled={isSavingTables} onClick={() => assignGuests(null)}>
                Sacar de mesa
              </button>
            </div>

            {tableMessage ? <p className="table-message">{tableMessage}</p> : null}

            <div className="table-card-grid">
              <article
                className="seat-card unassigned drop-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleGuestDrop(event, null)}
              >
                <div className="seat-card-head">
                  <div>
                    <h3>Sin mesa</h3>
                    <p>Click para seleccionar y mover en bloque</p>
                  </div>
                  <strong>{unassignedRows.length}</strong>
                </div>
                <button
                  className="seat-card-action"
                  type="button"
                  disabled={selectedGuestIds.length === 0 || isSavingTables}
                  onClick={() => assignGuests(null)}
                >
                  Sacar selección de mesa
                </button>
                <ul className="seat-guest-list">
                  {unassignedRows.map((row) => (
                    <li key={`unassigned-${row.id}`}>
                      <button
                        className={selectedGuestIds.includes(row.id) ? "seat-guest active" : "seat-guest"}
                        type="button"
                        draggable
                        onClick={() => toggleGuest(row.id)}
                        onDragStart={(event) => {
                          setDraggedGuestId(row.id);
                          event.dataTransfer.setData("text/plain", String(row.id));
                        }}
                        onDragEnd={() => setDraggedGuestId(null)}
                      >
                        <span>{row.name}</span>
                        <small>{row.food || "Sin restricción"}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </article>

              {localTables.map((table) => (
                <article
                  className={
                    (tableCounts[table.id] || 0) >= table.capacity ? "seat-card drop-zone is-full" : "seat-card drop-zone"
                  }
                  key={table.id}
                  onDragOver={(event) => {
                    if (draggedGuestId && canAssignToTable(table.id, [draggedGuestId])) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={(event) => handleGuestDrop(event, table.id)}
                >
                  <div className="seat-card-head">
                    {editingTableId === table.id ? (
                      <form className="seat-edit-form" onSubmit={renameTable}>
                        <input
                          value={editingTableName}
                          onChange={(event) => setEditingTableName(event.target.value)}
                          aria-label="Nombre de mesa"
                        />
                        <button type="submit" disabled={isSavingTables}>
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTableId(null);
                            setEditingTableName("");
                          }}
                        >
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <div>
                        <h3>{table.name}</h3>
                        <p>Arrastrá invitados o mové la selección</p>
                      </div>
                    )}
                    <strong>
                      {tableCounts[table.id] || 0}/{table.capacity}
                    </strong>
                  </div>
                  <div className="seat-card-actions">
                    <button
                      type="button"
                      disabled={
                        selectedGuestIds.length === 0 ||
                        isSavingTables ||
                        !canAssignToTable(table.id, selectedGuestIds)
                      }
                      onClick={() => assignGuests(table.id)}
                    >
                      Mover selección acá
                    </button>
                    <button type="button" onClick={() => startEditingTable(table)}>
                      Editar nombre
                    </button>
                  </div>
                  <ul className="seat-guest-list">
                    {acceptedRows
                      .filter((row) => row.tableId === table.id)
                      .map((row) => (
                        <li key={`table-${table.id}-${row.id}`}>
                          <button
                            className={selectedGuestIds.includes(row.id) ? "seat-guest active" : "seat-guest"}
                            type="button"
                            draggable
                            onClick={() => toggleGuest(row.id)}
                            onDragStart={(event) => {
                              setDraggedGuestId(row.id);
                              event.dataTransfer.setData("text/plain", String(row.id));
                            }}
                            onDragEnd={() => setDraggedGuestId(null)}
                          >
                            <span>{row.name}</span>
                            <small>{row.food || "Sin restricción"}</small>
                          </button>
                        </li>
                      ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="meal-breakdown-panel">
          <div className="table-heading">
            <h2>Detalle por comida</h2>
            <span>{Object.keys(mealGroups).length} opciones</span>
          </div>
          <div className="meal-breakdown-grid">
            {Object.entries(mealGroups).map(([meal, names]) => (
              <article className="meal-breakdown-card" key={meal}>
                <div>
                  <h3>{meal}</h3>
                  <strong>{names.length}</strong>
                </div>
                <ul>
                  {names.map((person) => (
                    <li key={`${meal}-${person.id}`}>
                      <button type="button" onClick={() => setSelectedRowId(person.id)}>
                        {person.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="messages-panel">
          <div className="table-heading">
            <h2>Mensajes para los novios</h2>
            <span>{messages.length} mensajes</span>
          </div>

          {messages.length > 0 ? (
            <div className="message-grid">
              {messages.map((submission) => (
                <article className="message-card" key={`message-${submission.id}`}>
                  <div>
                    <strong>
                      {submission.firstName} {submission.lastName}
                    </strong>
                    <span>{formatDate(submission.createdAt)}</span>
                  </div>
                  <p>{submission.message}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Todavía no hay mensajes cargados.</p>
          )}
        </section>
      </section>

      {selectedRow && selectedSubmission ? (
        <aside className="dashboard-side" aria-label="Detalle">
          <button className="drawer-close" type="button" onClick={() => setSelectedRowId(null)}>
            Cerrar
          </button>

          <section className="side-panel">
            <div className="side-heading">
              <h2>Submission</h2>
              <span className={selectedSubmission.attending ? "answer accept" : "answer decline"}>
                {selectedSubmission.attending ? "Confirmó" : "No viene"}
              </span>
            </div>

            <h3>
              {selectedSubmission.firstName} {selectedSubmission.lastName}
            </h3>
            <dl className="detail-list">
              <div>
                <dt>Enviado</dt>
                <dd>{formatDateTime(selectedSubmission.createdAt)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selectedSubmission.email}</dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>{selectedSubmission.whatsapp}</dd>
              </div>
              <div>
                <dt>Micro</dt>
                <dd>
                  {selectedSubmission.needsBus
                    ? `${selectedSubmissionPeople.filter((person) => person.attending).length} personas`
                    : "No"}
                </dd>
              </div>
            </dl>

            {selectedSubmissionPeople.length > 0 ? (
              <div className="mini-list">
                <h4>Personas en esta submission</h4>
                {selectedSubmissionPeople.map((person) => (
                  <button
                    className={person.id === selectedRowId ? "mini-row active" : "mini-row"}
                    type="button"
                    onClick={() => setSelectedRowId(person.id)}
                    key={person.id}
                  >
                    <span>{person.name}</span>
                    <small>{person.tableName || person.food || "No aplica"}</small>
                  </button>
                ))}
              </div>
            ) : null}

            {selectedSubmission.allergies ? (
              <div className="side-note">
                <strong>Alergias</strong>
                <p>{selectedSubmission.allergies}</p>
              </div>
            ) : null}

            {selectedSubmission.message ? (
              <div className="side-note">
                <strong>Mensaje</strong>
                <p>{selectedSubmission.message}</p>
              </div>
            ) : null}
          </section>

          <section className="side-panel">
            <div className="side-heading">
              <h2>Respuesta</h2>
              <span className={selectedRow.attending ? "answer accept" : "answer decline"}>
                {selectedRow.role}
              </span>
            </div>

            <h3>{selectedRow.name}</h3>
            <dl className="detail-list">
              <div>
                <dt>Estado</dt>
                <dd>{selectedRow.attending ? "Confirmó asistencia" : "No asiste"}</dd>
              </div>
              <div>
                <dt>Comida</dt>
                <dd>{selectedRow.food || "No aplica"}</dd>
              </div>
              <div>
                <dt>Mesa</dt>
                <dd>{selectedRow.tableName || (selectedRow.attending ? "Sin mesa" : "No aplica")}</dd>
              </div>
              <div>
                <dt>Micro</dt>
                <dd>{selectedRow.attending ? (selectedRow.needsBus ? "Sí" : "No") : "No aplica"}</dd>
              </div>
              <div>
                <dt>Mail</dt>
                <dd>{selectedRow.email}</dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>{selectedRow.whatsapp}</dd>
              </div>
              <div>
                <dt>Respondió</dt>
                <dd>{selectedRow.submittedBy}</dd>
              </div>
            </dl>
          </section>
        </aside>
      ) : null}
    </main>
  );
}
