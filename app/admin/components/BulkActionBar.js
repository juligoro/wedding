"use client";

import { useAdmin } from "../AdminContext";
import { downloadCsv } from "../lib/csv";

export default function BulkActionBar() {
  const {
    selectedGuestIds,
    selectedRows,
    setSelectedGuestIds,
    localTables,
    tableCounts,
    targetTableId,
    setTargetTableId,
    canAssignToTable,
    assignGuests,
    isSavingTables,
    bulkTag,
    setBulkTag,
    addTagToSelected,
    copySelected,
    selectUnassignedGuests,
    unassignedRows,
    softDeleteSelected,
  } = useAdmin();

  function handleBulkDelete() {
    if (window.confirm(`¿Mover ${selectedGuestIds.length} invitado(s) a la papelera?`)) {
      softDeleteSelected();
    }
  }

  if (selectedGuestIds.length === 0) {
    return (
      <div className="bulk-hint">
        <button type="button" onClick={selectUnassignedGuests}>
          Seleccionar sin mesa ({unassignedRows.length})
        </button>
        <span className="muted">Tip: tocá una fila para ver el detalle.</span>
      </div>
    );
  }

  return (
    <div className="bulk-bar" role="region" aria-label="Acciones en lote">
      <strong className="bulk-count">{selectedGuestIds.length} seleccionados</strong>

      <div className="bulk-group">
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
          className="primary"
          disabled={
            !targetTableId || isSavingTables || !canAssignToTable(targetTableId, selectedGuestIds)
          }
          onClick={() => assignGuests(targetTableId)}
        >
          Asignar a mesa
        </button>
        <button type="button" disabled={isSavingTables} onClick={() => assignGuests(null)}>
          Quitar mesa
        </button>
      </div>

      <div className="bulk-group">
        <input
          className="bulk-tag-input"
          value={bulkTag}
          onChange={(event) => setBulkTag(event.target.value)}
          placeholder="Nuevo tag"
        />
        <button type="button" disabled={isSavingTables} onClick={addTagToSelected}>
          Agregar tag
        </button>
      </div>

      <div className="bulk-group">
        <button type="button" onClick={() => downloadCsv(selectedRows)}>
          Exportar CSV
        </button>
        <button type="button" onClick={() => copySelected("email")}>
          Copiar emails
        </button>
        <button type="button" onClick={() => copySelected("whatsapp")}>
          Copiar WhatsApps
        </button>
      </div>

      <div className="bulk-group">
        <button
          type="button"
          className="danger-button"
          disabled={isSavingTables}
          onClick={handleBulkDelete}
        >
          Eliminar
        </button>
      </div>

      <button type="button" className="bulk-clear" onClick={() => setSelectedGuestIds([])}>
        Limpiar
      </button>
    </div>
  );
}
