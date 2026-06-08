"use client";

import { useAdmin } from "../AdminContext";
import { formatDateTime } from "../lib/format";

export default function TrashView() {
  const { trash, crudMessage, restoreRsvp, restoreGuest, purgeRsvp, purgeGuest } = useAdmin();

  const hasItems = trash.rsvps.length > 0 || trash.guests.length > 0;

  function confirmPurgeRsvp(rsvp) {
    if (
      window.confirm(
        `Eliminar para siempre el envío de ${rsvp.firstName} ${rsvp.lastName}. Esta acción no se puede deshacer. ¿Continuar?`,
      )
    ) {
      purgeRsvp(rsvp.id);
    }
  }

  function confirmPurgeGuest(guest) {
    if (
      window.confirm(
        `Eliminar para siempre a ${guest.fullName}. Esta acción no se puede deshacer. ¿Continuar?`,
      )
    ) {
      purgeGuest(guest.id);
    }
  }

  return (
    <div className="view view-trash">
      <header className="view-header">
        <h2>Papelera</h2>
        <span className="muted">
          {trash.rsvps.length} envíos · {trash.guests.length} invitados
        </span>
      </header>

      {crudMessage ? <p className="import-message">{crudMessage}</p> : null}

      {!hasItems ? (
        <p className="empty">La papelera está vacía.</p>
      ) : (
        <>
          {trash.rsvps.length > 0 ? (
            <section className="panel">
              <div className="panel-head">
                <h3>Envíos eliminados</h3>
                <span className="muted">{trash.rsvps.length}</span>
              </div>
              <div className="trash-list">
                {trash.rsvps.map((rsvp) => (
                  <article className="trash-card" key={`rsvp-${rsvp.id}`}>
                    <div className="trash-info">
                      <div className="trash-title">
                        <strong>
                          {rsvp.firstName} {rsvp.lastName}
                        </strong>
                        <span className={rsvp.attending ? "badge ok" : "badge no"}>
                          {rsvp.attending ? "Confirmó" : "No viene"}
                        </span>
                      </div>
                      <span className="cell-sub">
                        {rsvp.guests.map((guest) => guest.fullName).join(" · ")}
                      </span>
                      <span className="cell-sub">Eliminado {formatDateTime(rsvp.deletedAt)}</span>
                    </div>
                    <div className="trash-actions">
                      <button type="button" onClick={() => restoreRsvp(rsvp.id)}>
                        Restaurar
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => confirmPurgeRsvp(rsvp)}
                      >
                        Eliminar definitivamente
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {trash.guests.length > 0 ? (
            <section className="panel">
              <div className="panel-head">
                <h3>Invitados eliminados</h3>
                <span className="muted">{trash.guests.length}</span>
              </div>
              <div className="trash-list">
                {trash.guests.map((guest) => (
                  <article className="trash-card" key={`guest-${guest.id}`}>
                    <div className="trash-info">
                      <div className="trash-title">
                        <strong>{guest.fullName}</strong>
                        <span className="badge subtle">{guest.role}</span>
                      </div>
                      <span className="cell-sub">
                        Del envío de {guest.rsvp?.firstName} {guest.rsvp?.lastName}
                      </span>
                      <span className="cell-sub">Eliminado {formatDateTime(guest.deletedAt)}</span>
                    </div>
                    <div className="trash-actions">
                      <button type="button" onClick={() => restoreGuest(guest.id)}>
                        Restaurar
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => confirmPurgeGuest(guest)}
                      >
                        Eliminar definitivamente
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
