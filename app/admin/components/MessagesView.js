"use client";

import { useAdmin } from "../AdminContext";
import { formatDate } from "../lib/format";

export default function MessagesView() {
  const { messages } = useAdmin();

  return (
    <div className="view view-messages">
      <header className="view-header">
        <h2>Mensajes para los novios</h2>
        <span className="muted">{messages.length} mensajes</span>
      </header>

      {messages.length > 0 ? (
        <div className="message-grid wide">
          {messages.map((submission) => (
            <article className="message-card" key={`message-${submission.id}`}>
              <div className="message-meta">
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
        <p className="empty">Todavía no hay mensajes cargados.</p>
      )}
    </div>
  );
}
