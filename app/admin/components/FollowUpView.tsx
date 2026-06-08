"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { parseJson } from "@/lib/guests";

import { useAdmin } from "../AdminContext";
import { downloadInviteesCsv } from "../lib/csv";
import { CONFIDENCE_LABELS } from "../lib/match";
import type { InviteeStatus, ReconcileItem } from "../types";

const STATUS_LABELS: Record<InviteeStatus, string> = {
  accepted: "Confirmó",
  declined: "No viene",
  pending: "Sin responder",
};
const STATUS_TONES: Record<InviteeStatus, string> = {
  accepted: "ok",
  declined: "no",
  pending: "pending",
};
const FILTERS: { id: string; label: string }[] = [
  { id: "pending", label: "Sin responder" },
  { id: "uncontacted", label: "Sin contactar" },
  { id: "responded", label: "Respondieron" },
  { id: "all", label: "Todos" },
];

const COL_COUNT = 6;

interface DraftMember {
  firstName: string;
  lastName: string;
}

interface HouseholdDraft {
  members: DraftMember[];
  greeting: string;
  locale: string;
  household: string;
  email: string;
  whatsapp: string;
}

function emptyDraft(): HouseholdDraft {
  return {
    members: [{ firstName: "", lastName: "" }],
    greeting: "",
    locale: "es",
    household: "",
    email: "",
    whatsapp: "",
  };
}

function draftFromItem(item: ReconcileItem): HouseholdDraft {
  const members = parseJson<DraftMember[]>(item.members, []);

  return {
    members: members.length > 0 ? members : [{ firstName: "", lastName: "" }],
    greeting: item.greeting || "",
    locale: item.locale || "es",
    household: item.household || "",
    email: item.email || "",
    whatsapp: item.whatsapp || "",
  };
}

export default function FollowUpView() {
  const {
    reconciliation,
    filteredInvitees,
    pendingInvitees,
    rowsWithTableNames,
    followFilter,
    setFollowFilter,
    followQuery,
    setFollowQuery,
    importMode,
    setImportMode,
    importInvitees,
    addInvitee,
    saveInvitee,
    isImporting,
    inviteeMessage,
    setInviteeMessage,
    toggleContacted,
    setManualMatch,
    clearInvitees,
  } = useAdmin();

  const fileRef = useRef<HTMLInputElement>(null);
  const [origin, setOrigin] = useState("");
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<HouseholdDraft | null>(null);
  const { stats } = reconciliation;
  const hasList = stats.total > 0;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function linkFor(item: ReconcileItem): string {
    return `${origin}/i/${item.token}`;
  }

  function messageFor(item: ReconcileItem): string {
    const greeting = item.greeting || item.fullName;
    const link = linkFor(item);

    return item.locale === "en"
      ? `Hi ${greeting}! We'd love for you to join us at our wedding. Please RSVP here: ${link}`
      : `¡Hola ${greeting}! Nos encantaría que nos acompañen en nuestro casamiento. Confirmá tu asistencia acá: ${link}`;
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setInviteeMessage(`${label} copiado.`);
    } catch {
      setInviteeMessage("No pudimos copiar al portapapeles.");
    }
  }

  function startEdit(item: ReconcileItem) {
    setDraft(draftFromItem(item));
    setEditingId(item.id);
  }

  function startNew() {
    setDraft(emptyDraft());
    setEditingId("new");
  }

  function cancelEdit() {
    setDraft(null);
    setEditingId(null);
  }

  function updateDraft(patch: Partial<HouseholdDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function updateDraftMember(index: number, patch: Partial<DraftMember>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            members: current.members.map((member, i) =>
              i === index ? { ...member, ...patch } : member,
            ),
          }
        : current,
    );
  }

  async function saveDraft() {
    if (!draft) {
      return;
    }

    const payload = {
      members: draft.members,
      greeting: draft.greeting,
      locale: draft.locale,
      email: draft.email,
      whatsapp: draft.whatsapp,
      household: draft.household,
    };

    if (editingId === "new") {
      const ok = await addInvitee(payload);

      if (ok) {
        // Keep the editor open and blank so several households can be added in a
        // row without the list collapsing under you.
        setDraft(emptyDraft());
      }

      return;
    }

    const ok = await saveInvitee(editingId as number, payload);

    if (ok) {
      cancelEdit();
    }
  }

  function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];

    importInvitees(file);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  async function copyPendingWhatsapps() {
    const numbers = Array.from(
      new Set(pendingInvitees.map((item) => item.whatsapp).filter(Boolean)),
    );

    if (numbers.length === 0) {
      setInviteeMessage("No hay WhatsApps cargados en los pendientes.");
      return;
    }

    try {
      await navigator.clipboard.writeText(numbers.join("\n"));
      setInviteeMessage(`${numbers.length} WhatsApps de pendientes copiados.`);
    } catch {
      setInviteeMessage("No pudimos copiar al portapapeles.");
    }
  }

  function renderEditor() {
    if (!draft) {
      return null;
    }

    return (
      <div className="household-editor">
        <div className="add-members">
          <span className="he-label">Personas del hogar</span>
          {draft.members.map((member, index) => (
            <div className="add-member-row" key={index}>
              <input
                placeholder="Nombre"
                value={member.firstName}
                onChange={(event) => updateDraftMember(index, { firstName: event.target.value })}
              />
              <input
                placeholder="Apellido"
                value={member.lastName}
                onChange={(event) => updateDraftMember(index, { lastName: event.target.value })}
              />
              {draft.members.length > 1 ? (
                <button
                  type="button"
                  className="link-button danger"
                  onClick={() =>
                    updateDraft({ members: draft.members.filter((_, i) => i !== index) })
                  }
                >
                  quitar
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="link-button"
            onClick={() => updateDraft({ members: [...draft.members, { firstName: "", lastName: "" }] })}
          >
            + Agregar persona
          </button>
        </div>

        <div className="add-fields">
          <label>
            <span>Saludo (opcional)</span>
            <input
              placeholder="Ej. Familia Goro o Lorena y Pablo"
              value={draft.greeting}
              onChange={(event) => updateDraft({ greeting: event.target.value })}
            />
          </label>
          <label>
            <span>Grupo (opcional)</span>
            <input
              placeholder="Clave interna (no la ve el invitado)"
              value={draft.household}
              onChange={(event) => updateDraft({ household: event.target.value })}
            />
          </label>
          <label>
            <span>Idioma</span>
            <select value={draft.locale} onChange={(event) => updateDraft({ locale: event.target.value })}>
              <option value="es">Español</option>
              <option value="en">Inglés</option>
            </select>
          </label>
          <label>
            <span>Email (opcional)</span>
            <input
              type="email"
              value={draft.email}
              onChange={(event) => updateDraft({ email: event.target.value })}
            />
          </label>
          <label>
            <span>WhatsApp (opcional)</span>
            <input
              value={draft.whatsapp}
              onChange={(event) => updateDraft({ whatsapp: event.target.value })}
            />
          </label>
        </div>

        <div className="household-actions">
          <button type="button" className="primary" onClick={saveDraft} disabled={isImporting}>
            {isImporting ? "Guardando…" : editingId === "new" ? "Crear hogar y generar link" : "Guardar cambios"}
          </button>
          <button type="button" className="link-button" onClick={cancelEdit}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view view-follow">
      <header className="view-header">
        <h2>Seguimiento</h2>
        <div className="view-actions">
          <button type="button" onClick={() => downloadInviteesCsv(pendingInvitees)}>
            Descargar sin responder
          </button>
          <button type="button" onClick={copyPendingWhatsapps}>
            Copiar WhatsApps pendientes
          </button>
        </div>
      </header>

      <section className="panel import-card">
        <div className="panel-head">
          <h3>Cargar lista de invitados</h3>
          {hasList ? (
            <button type="button" className="link-button danger" onClick={clearInvitees}>
              Vaciar lista
            </button>
          ) : null}
        </div>
        <form className="import-form" onSubmit={submitImport}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" />
          <div className="segmented">
            <button
              type="button"
              className={importMode === "replace" ? "active" : ""}
              onClick={() => setImportMode("replace")}
            >
              Reemplazar lista
            </button>
            <button
              type="button"
              className={importMode === "append" ? "active" : ""}
              onClick={() => setImportMode("append")}
            >
              Agregar / actualizar
            </button>
          </div>
          <button type="submit" className="primary" disabled={isImporting}>
            {isImporting ? "Procesando…" : "Importar"}
          </button>
        </form>
        <p className="import-hint">
          Aceptamos <strong>.xlsx</strong> y <strong>.csv</strong>. <strong>Una fila por persona.</strong>{" "}
          Las filas con el mismo <em>Grupo</em> (alias: Hogar / Familia) se juntan en un hogar con un
          solo link. Detectamos <em>Nombre</em>, <em>Apellido</em>, <em>Grupo</em>, <em>Saludo</em>{" "}
          (lo que ve el invitado), <em>Idioma</em> (ES/EN), <em>Email</em> y <em>WhatsApp</em>.{" "}
          También podés <strong>agregar y editar hogares a mano</strong> directamente en la tabla de abajo.
        </p>
        {inviteeMessage ? <p className="import-message">{inviteeMessage}</p> : null}
      </section>

      {hasList ? (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-body">
              <span className="stat-label">En la lista</span>
              <strong className="stat-value">{stats.total}</strong>
              <span className="stat-hint">Hogares cargados</span>
            </div>
          </div>
          <div className="stat-card tone-ok">
            <div className="stat-body">
              <span className="stat-label">Respondieron</span>
              <strong className="stat-value">{stats.accepted + stats.declined}</strong>
              <span className="stat-hint">
                {stats.accepted} confirmaron · {stats.declined} no vienen
              </span>
            </div>
          </div>
          <div className="stat-card tone-pending">
            <div className="stat-body">
              <span className="stat-label">Sin responder</span>
              <strong className="stat-value">{stats.pending}</strong>
              <span className="stat-hint">{stats.contacted} ya contactados</span>
            </div>
          </div>
          {stats.extras > 0 ? (
            <div className="stat-card">
              <div className="stat-body">
                <span className="stat-label">Fuera de lista</span>
                <strong className="stat-value">{stats.extras}</strong>
                <span className="stat-hint">Respondieron pero no están en la lista</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasList ? (
        <div className="toolbar">
          <label className="search-field">
            <span className="sr-only">Buscar</span>
            <input
              type="search"
              value={followQuery}
              onChange={(event) => setFollowQuery(event.target.value)}
              placeholder="Buscar por nombre, grupo, email…"
            />
          </label>
          <div className="segmented">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={followFilter === filter.id ? "active" : ""}
                onClick={() => setFollowFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="empty">
          Subí tu planilla de invitados, o agregá hogares a mano directamente en la tabla.
        </p>
      )}

      <div className="table-wrap">
        <table className="guest-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Link personalizado</th>
              <th>Mensaje completo</th>
              <th>Contacto</th>
              <th>Contactado</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvitees.map((item) => (
              <Fragment key={item.id}>
                <tr>
                  <td>
                    <div className="invitee-name">
                      <strong>{item.fullName}</strong>
                      {item.household ? <span className="cell-sub">{item.household}</span> : null}
                      <button
                        type="button"
                        className="link-button edit-toggle"
                        onClick={() => (editingId === item.id ? cancelEdit() : startEdit(item))}
                      >
                        {editingId === item.id ? "cerrar" : "editar"}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_TONES[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </td>
                  <td>
                    <div className="invite-link-cell">
                      <a
                        href={linkFor(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="invite-link"
                        title={linkFor(item)}
                      >
                        /i/{item.token}
                      </a>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => copyText(linkFor(item), "Link")}
                      >
                        copiar
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => copyText(messageFor(item), "Mensaje")}
                    >
                      Copiar mensaje
                    </button>
                  </td>
                  <td>
                    <span className="cell-sub">{item.whatsapp || "—"}</span>
                    <span className="cell-sub">{item.email || ""}</span>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(item.contacted)}
                      onChange={(event) => toggleContacted(item.id, event.target.checked)}
                    />
                  </td>
                </tr>
                {editingId === item.id ? (
                  <tr className="editor-row">
                    <td colSpan={COL_COUNT}>
                      {renderEditor()}
                      <div className="editor-match">
                        <span className="he-label">Coincidencia con la respuesta</span>
                        {item.matchedGuest ? (
                          <div className="match-cell">
                            <span>{item.matchedGuest.name}</span>
                            <span className={`match-badge conf-${item.confidence}`}>
                              {CONFIDENCE_LABELS[item.confidence]}
                            </span>
                            {item.confidence === "manual" || item.confidence === "partial" ? (
                              <button
                                type="button"
                                className="link-button"
                                onClick={() => setManualMatch(item.id, null)}
                              >
                                quitar
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <select
                            value=""
                            onChange={(event) => setManualMatch(item.id, event.target.value)}
                          >
                            <option value="">Vincular a una respuesta…</option>
                            {rowsWithTableNames.map((row) => (
                              <option key={row.id} value={row.id}>
                                {row.name} · {row.attending ? "Confirmó" : "No viene"}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}

            {hasList && filteredInvitees.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="empty">
                  No hay invitados para este filtro.
                </td>
              </tr>
            ) : null}

            {editingId === "new" ? (
              <tr className="editor-row">
                <td colSpan={COL_COUNT}>{renderEditor()}</td>
              </tr>
            ) : (
              <tr className="add-row">
                <td colSpan={COL_COUNT}>
                  <button type="button" className="link-button" onClick={startNew}>
                    + Agregar hogar a mano
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {reconciliation.extras.length > 0 ? (
        <section className="panel">
          <div className="panel-head">
            <h3>Respondieron pero no están en la lista</h3>
            <span className="muted">{reconciliation.extras.length}</span>
          </div>
          <div className="chip-list">
            {reconciliation.extras.map((row) => (
              <span key={row.id} className="chip static">
                {row.name} · {row.attending ? "Confirmó" : "No viene"}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
