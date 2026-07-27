"use client";

import { useAdmin } from "../AdminContext";
import { formatDateTime } from "../lib/format";
import type { SerializedGuest, SerializedInvitee, SerializedSubmission } from "../types";

export default function TrashView() {
  const {
    trash,
    crudMessage,
    restoreRsvp,
    restoreGuest,
    purgeRsvp,
    purgeGuest,
    restoreInvitee,
    purgeInvitee,
  } = useAdmin();

  const hasItems =
    trash.rsvps.length > 0 || trash.guests.length > 0 || trash.invitees.length > 0;

  function confirmPurgeRsvp(rsvp: SerializedSubmission) {
    if (
      window.confirm(
        `Eliminar para siempre el envío de ${rsvp.firstName} ${rsvp.lastName}. Esta acción no se puede deshacer. ¿Continuar?`,
      )
    ) {
      purgeRsvp(rsvp.id);
    }
  }

  function confirmPurgeGuest(guest: SerializedGuest) {
    if (
      window.confirm(
        `Eliminar para siempre a ${guest.fullName}. Esta acción no se puede deshacer. ¿Continuar?`,
      )
    ) {
      purgeGuest(guest.id);
    }
  }

  function confirmPurgeInvitee(invitee: SerializedInvitee) {
    if (
      window.confirm(
        `Eliminar para siempre el hogar de ${invitee.fullName} (y su link). Esta acción no se puede deshacer. ¿Continuar?`,
      )
    ) {
      purgeInvitee(invitee.id);
    }
  }

  return (
    <div className="view view-trash">
      <header className="view-header">
        <h2>Papelera</h2>
        <span className="muted">
          {trash.rsvps.length} envíos · {trash.guests.length} invitados · {trash.invitees.length}{" "}
          hogares
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

          {trash.invitees.length > 0 ? (
            <section className="panel">
              <div className="panel-head">
                <h3>Hogares archivados</h3>
                <span className="muted">{trash.invitees.length}</span>
              </div>
              <div className="trash-list">
                {trash.invitees.map((invitee) => (
                  <article className="trash-card" key={`invitee-${invitee.id}`}>
                    <div className="trash-info">
                      <div className="trash-title">
                        <strong>{invitee.fullName}</strong>
                        <span className="badge subtle">
                          {invitee.party} {invitee.party === 1 ? "persona" : "personas"}
                        </span>
                      </div>
                      {invitee.household ? (
                        <span className="cell-sub">Grupo {invitee.household}</span>
                      ) : null}
                      <span className="cell-sub">Archivado {formatDateTime(invitee.deletedAt)}</span>
                    </div>
                    <div className="trash-actions">
                      <button type="button" onClick={() => restoreInvitee(invitee.id)}>
                        Restaurar
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => confirmPurgeInvitee(invitee)}
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
