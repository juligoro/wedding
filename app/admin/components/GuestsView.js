"use client";

import { useAdmin } from "../AdminContext";
import { downloadCsv } from "../lib/csv";
import BulkActionBar from "./BulkActionBar";
import GuestTable from "./GuestTable";

export default function GuestsView() {
  const {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    mealFilter,
    setMealFilter,
    busFilter,
    setBusFilter,
    mealOptions,
    filteredRows,
    rowsWithTableNames,
  } = useAdmin();

  return (
    <div className="view view-guests">
      <header className="view-header">
        <h2>Invitados</h2>
        <div className="view-actions">
          <span className="muted">
            {filteredRows.length} de {rowsWithTableNames.length}
          </span>
          <button type="button" onClick={() => downloadCsv(rowsWithTableNames)}>
            Descargar CSV
          </button>
        </div>
      </header>

      <div className="toolbar">
        <label className="search-field">
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, email, mesa, tag…"
          />
        </label>
        <label className="filter-field">
          Estado
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos</option>
            <option value="accepted">Confirmados</option>
            <option value="declined">No confirmados</option>
          </select>
        </label>
        <label className="filter-field">
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
        <label className="filter-field">
          Micro
          <select value={busFilter} onChange={(event) => setBusFilter(event.target.value)}>
            <option value="all">Todos</option>
            <option value="yes">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>

      <BulkActionBar />
      <GuestTable />
    </div>
  );
}
