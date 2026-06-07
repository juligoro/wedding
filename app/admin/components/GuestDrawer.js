"use client";

import { useEffect, useState } from "react";

import { useAdmin } from "../AdminContext";
import { formatDateTime } from "../lib/format";

export default function GuestDrawer() {
  const {
    selectedRow,
    selectedSubmission,
    selectedSubmissionPeople,
    selectedRowId,
    setSelectedRowId,
    saveGuest,
    assignGuests,
    canAssignToTable,
    localTables,
    tableCounts,
    mealOptions,
    isSavingTables,
  } = useAdmin();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    setIsEditing(false);
  }, [selectedRowId]);

  if (!selectedRow || !selectedSubmission) {
    return null;
  }

  function startEditing() {
    setForm({
      firstName: selectedRow.firstName || "",
      lastName: selectedRow.lastName || "",
      food: selectedRow.food || "",
      allergies: selectedRow.allergies || "",
      needsBus: Boolean(selectedRow.needsBus),
      tableId: selectedRow.tableId ? String(selectedRow.tableId) : "",
    });
    setIsEditing(true);
  }

  async function handleSave(event) {
    event.preventDefault();

    const ok = await saveGuest(selectedRow.id, {
      firstName: form.firstName,
      lastName: form.lastName,
      food: form.food,
      allergies: form.allergies,
      needsBus: selectedRow.attending ? form.needsBus : null,
    });

    if (!ok) {
      return;
    }

    if (selectedRow.attending) {
      const nextTableId = form.tableId === "" ? null : Number(form.tableId);
      const currentTableId = selectedRow.tableId || null;

      if (nextTableId !== currentTableId) {
        await assignGuests(nextTableId, [selectedRow.id]);
      }
    }

    setIsEditing(false);
  }

  return (
    <aside className="guest-drawer" aria-label="Detalle del invitado">
      <div className="drawer-top">
        <button type="button" className="drawer-close" onClick={() => setSelectedRowId(null)}>
          Cerrar
        </button>
        {!isEditing ? (
          <button type="button" className="drawer-edit" onClick={startEditing}>
            Editar
          </button>
        ) : null}
      </div>

      <section className="drawer-panel">
        <div className="drawer-heading">
          <h2>Envío</h2>
          <span className={selectedSubmission.attending ? "badge ok" : "badge no"}>
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
            <h4>Personas en este envío</h4>
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

        {selectedSubmission.message ? (
          <div className="drawer-note">
            <strong>Mensaje</strong>
            <p>{selectedSubmission.message}</p>
          </div>
        ) : null}
      </section>

      <section className="drawer-panel">
        <div className="drawer-heading">
          <h2>Respuesta</h2>
          <span className="badge subtle">{selectedRow.role}</span>
        </div>

        {isEditing ? (
          <form className="drawer-edit-form" onSubmit={handleSave}>
            <label>
              Nombre
              <input
                value={form.firstName}
                onChange={(event) => setForm((f) => ({ ...f, firstName: event.target.value }))}
                required
              />
            </label>
            <label>
              Apellido
              <input
                value={form.lastName}
                onChange={(event) => setForm((f) => ({ ...f, lastName: event.target.value }))}
              />
            </label>

            {selectedRow.attending ? (
              <>
                <label>
                  Comida
                  <input
                    value={form.food}
                    onChange={(event) => setForm((f) => ({ ...f, food: event.target.value }))}
                    list="meal-options"
                    placeholder="Ej: Carne, Vegetariano…"
                  />
                  <datalist id="meal-options">
                    {mealOptions.map((meal) => (
                      <option key={meal} value={meal} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Alergias
                  <input
                    value={form.allergies}
                    onChange={(event) => setForm((f) => ({ ...f, allergies: event.target.value }))}
                  />
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.needsBus}
                    onChange={(event) => setForm((f) => ({ ...f, needsBus: event.target.checked }))}
                  />
                  Necesita micro
                </label>
                <label>
                  Mesa
                  <select
                    value={form.tableId}
                    onChange={(event) => setForm((f) => ({ ...f, tableId: event.target.value }))}
                  >
                    <option value="">Sin mesa</option>
                    {localTables.map((table) => (
                      <option
                        key={table.id}
                        value={table.id}
                        disabled={!canAssignToTable(table.id, [selectedRow.id])}
                      >
                        {table.name} ({tableCounts[table.id] || 0}/{table.capacity})
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            <div className="drawer-edit-actions">
              <button type="submit" className="primary" disabled={isSavingTables}>
                Guardar
              </button>
              <button type="button" onClick={() => setIsEditing(false)} disabled={isSavingTables}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
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
                <dt>Alergias</dt>
                <dd>{selectedRow.allergies || "—"}</dd>
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
                <dt>Email</dt>
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
              {selectedRow.tags.length > 0 ? (
                <div>
                  <dt>Tags</dt>
                  <dd>{selectedRow.tags.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
          </>
        )}
      </section>
    </aside>
  );
}
