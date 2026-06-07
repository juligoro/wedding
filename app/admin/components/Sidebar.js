"use client";

import { useAdmin } from "../AdminContext";

const SECTIONS = [
  { id: "overview", label: "Resumen" },
  { id: "guests", label: "Invitados" },
  { id: "seating", label: "Mesas" },
  { id: "follow", label: "Seguimiento" },
  { id: "messages", label: "Mensajes" },
];

export default function Sidebar() {
  const {
    activeSection,
    setActiveSection,
    acceptedCount,
    declinedCount,
    unassignedRows,
    messages,
    rowsWithTableNames,
    pendingInvitees,
  } = useAdmin();

  const counts = {
    overview: null,
    guests: rowsWithTableNames.length,
    seating: unassignedRows.length,
    follow: pendingInvitees.length || null,
    messages: messages.length,
  };

  function logout() {
    fetch("/api/admin/logout", { method: "POST" }).finally(() => {
      window.location.href = "/admin/login";
    });
  }

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <p className="sidebar-kicker">Panel privado</p>
        <h1>Juli &amp; Tomi</h1>
        <p className="sidebar-sub">
          {acceptedCount} confirmados · {declinedCount} no vienen
        </p>
      </div>

      <nav className="sidebar-nav" aria-label="Secciones">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={activeSection === section.id ? "sidebar-link active" : "sidebar-link"}
            onClick={() => setActiveSection(section.id)}
            aria-current={activeSection === section.id ? "page" : undefined}
          >
            <span>{section.label}</span>
            {counts[section.id] != null ? (
              <span className="sidebar-count">{counts[section.id]}</span>
            ) : null}
          </button>
        ))}
      </nav>

      <button type="button" className="sidebar-logout" onClick={logout}>
        Salir
      </button>
    </aside>
  );
}
