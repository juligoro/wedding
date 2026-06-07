"use client";

import { useAdmin } from "../AdminContext";

export default function GuestTable() {
  const {
    filteredRows,
    selectedRowId,
    setSelectedRowId,
    selectedGuestIds,
    toggleGuest,
    allVisibleSelected,
    toggleVisibleGuests,
  } = useAdmin();

  return (
    <div className="table-wrap">
      <table className="guest-table">
        <thead>
          <tr>
            <th className="col-check">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleVisibleGuests}
                aria-label="Seleccionar confirmados visibles"
              />
            </th>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Comida</th>
            <th>Micro</th>
            <th>Mesa</th>
            <th>Tags</th>
            <th className="col-action" />
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row) => (
            <tr
              key={row.id}
              className={row.id === selectedRowId ? "is-selected" : ""}
              onClick={() => setSelectedRowId(row.id)}
            >
              <td className="col-check" onClick={(event) => event.stopPropagation()}>
                {row.attending ? (
                  <input
                    type="checkbox"
                    checked={selectedGuestIds.includes(row.id)}
                    onChange={() => toggleGuest(row.id)}
                    aria-label={`Seleccionar ${row.name}`}
                  />
                ) : null}
              </td>
              <td className="col-name">
                <span className="cell-name">{row.name}</span>
                {row.role === "Acompañante" ? (
                  <span className="cell-role">Acompañante</span>
                ) : null}
              </td>
              <td>
                <span className={row.attending ? "badge ok" : "badge no"}>
                  {row.attending ? "Confirmó" : "No viene"}
                </span>
              </td>
              <td>{row.food || "—"}</td>
              <td>{row.attending ? (row.needsBus ? "Sí" : "No") : "—"}</td>
              <td>{row.tableName || (row.attending ? "Sin mesa" : "—")}</td>
              <td>
                {row.tags.length > 0 ? (
                  <span className="tag-pills">
                    {row.tags.map((tag) => (
                      <span className="tag-pill" key={`${row.id}-${tag}`}>
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="col-action">
                <button
                  type="button"
                  className="row-detail"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedRowId(row.id);
                  }}
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredRows.length === 0 ? (
        <p className="empty">No hay respuestas que coincidan con esos filtros.</p>
      ) : null}
    </div>
  );
}
