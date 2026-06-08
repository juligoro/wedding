"use client";

import Select from "@/components/ui/Select";

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
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            ariaLabel="Filtrar por estado"
            options={[
              { value: "all", label: "Todos" },
              { value: "accepted", label: "Confirmados" },
              { value: "declined", label: "No confirmados" },
            ]}
          />
        </label>
        <label className="filter-field">
          Comida
          <Select
            value={mealFilter}
            onValueChange={setMealFilter}
            ariaLabel="Filtrar por comida"
            options={[
              { value: "all", label: "Todas" },
              ...mealOptions.map((meal) => ({ value: meal, label: meal })),
            ]}
          />
        </label>
        <label className="filter-field">
          Micro
          <Select
            value={busFilter}
            onValueChange={setBusFilter}
            ariaLabel="Filtrar por micro"
            options={[
              { value: "all", label: "Todos" },
              { value: "yes", label: "Sí" },
              { value: "no", label: "No" },
            ]}
          />
        </label>
      </div>

      <BulkActionBar />
      <GuestTable />
    </div>
  );
}
