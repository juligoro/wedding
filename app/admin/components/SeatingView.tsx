"use client";

import { useAdmin } from "../AdminContext";
import type { Row } from "../types";

function GuestChip({ row }: { row: Row }) {
  const { selectedGuestIds, toggleGuest, setDraggedGuestId } = useAdmin();

  return (
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
  );
}

export default function SeatingView() {
  const {
    localTables,
    tableCounts,
    acceptedRows,
    unassignedRows,
    selectedGuestIds,
    isSavingTables,
    newTableName,
    setNewTableName,
    createTable,
    quickAddTableId,
    setQuickAddTableId,
    tableGuestQuery,
    setTableGuestQuery,
    quickAddCandidates,
    assignGuests,
    canAssignToTable,
    handleGuestDrop,
    draggedGuestId,
    editingTableId,
    editingTableName,
    setEditingTableName,
    setEditingTableId,
    renameTable,
    startEditingTable,
    tableMessage,
  } = useAdmin();

  return (
    <div className="view view-seating">
      <header className="view-header">
        <h2>Mesas</h2>
        <span className="muted">{unassignedRows.length} confirmados sin mesa</span>
      </header>

      <div className="seating-tools">
        <form className="inline-form" onSubmit={createTable}>
          <input
            value={newTableName}
            onChange={(event) => setNewTableName(event.target.value)}
            placeholder="Nombre de mesa"
          />
          <button type="submit" className="primary" disabled={isSavingTables}>
            Crear mesa
          </button>
        </form>

        <div className="quick-add">
          <label className="filter-field">
            Buscar invitado
            <input
              value={tableGuestQuery}
              onChange={(event) => setTableGuestQuery(event.target.value)}
              placeholder="Escribí un nombre"
            />
          </label>
          <label className="filter-field">
            Agregar a mesa
            <select
              value={quickAddTableId}
              onChange={(event) => setQuickAddTableId(event.target.value)}
            >
              <option value="">Elegir mesa</option>
              {localTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name} ({tableCounts[table.id] || 0}/{table.capacity})
                </option>
              ))}
            </select>
          </label>
        </div>

        {tableGuestQuery.trim() ? (
          <div className="quick-add-results">
            {quickAddCandidates.length > 0 ? (
              quickAddCandidates.map((row) => {
                const canAdd = quickAddTableId && canAssignToTable(quickAddTableId, [row.id]);

                return (
                  <button
                    className="quick-add-person"
                    type="button"
                    key={`quick-add-${row.id}`}
                    disabled={!canAdd || isSavingTables}
                    onClick={() => assignGuests(quickAddTableId, [row.id])}
                  >
                    <span>{row.name}</span>
                    <small>
                      {row.tableName || "Sin mesa"} · {row.food || "Sin restricción"}
                    </small>
                    <strong>
                      {quickAddTableId ? (canAdd ? "Agregar" : "Mesa llena") : "Elegí mesa"}
                    </strong>
                  </button>
                );
              })
            ) : (
              <p className="empty">No encontramos invitados con ese nombre.</p>
            )}
          </div>
        ) : null}
      </div>

      {tableMessage ? <p className="inline-message">{tableMessage}</p> : null}
      {selectedGuestIds.length > 0 ? (
        <p className="inline-message subtle">
          {selectedGuestIds.length} seleccionados — arrastrá o usá “Mover selección acá”.
        </p>
      ) : null}

      <div className="seat-grid">
        <article
          className="seat-card unassigned drop-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleGuestDrop(event, null)}
        >
          <div className="seat-head">
            <div>
              <h3>Sin mesa</h3>
              <p>Tocá para seleccionar y mover en bloque</p>
            </div>
            <strong>{unassignedRows.length}</strong>
          </div>
          <button
            className="seat-action"
            type="button"
            disabled={selectedGuestIds.length === 0 || isSavingTables}
            onClick={() => assignGuests(null)}
          >
            Sacar selección de mesa
          </button>
          <ul className="seat-guest-list">
            {unassignedRows.map((row) => (
              <li key={`unassigned-${row.id}`}>
                <GuestChip row={row} />
              </li>
            ))}
          </ul>
        </article>

        {localTables.map((table) => (
          <article
            className={
              (tableCounts[table.id] || 0) >= table.capacity
                ? "seat-card drop-zone is-full"
                : "seat-card drop-zone"
            }
            key={table.id}
            onDragOver={(event) => {
              if (draggedGuestId && canAssignToTable(table.id, [draggedGuestId])) {
                event.preventDefault();
              }
            }}
            onDrop={(event) => handleGuestDrop(event, table.id)}
          >
            <div className="seat-head">
              {editingTableId === table.id ? (
                <form className="seat-edit-form" onSubmit={renameTable}>
                  <input
                    value={editingTableName}
                    onChange={(event) => setEditingTableName(event.target.value)}
                    aria-label="Nombre de mesa"
                  />
                  <button type="submit" className="primary" disabled={isSavingTables}>
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
            <div className="seat-actions">
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
                    <GuestChip row={row} />
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
