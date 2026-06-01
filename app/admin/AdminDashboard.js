"use client";

import { useMemo, useState } from "react";

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function splitName(name) {
  const [firstName = name, ...lastNameParts] = name.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
}

function getPeopleFromSubmission(submission) {
  if (!submission.attending) {
    return [];
  }

  const companions = parseJson(submission.companions, []);
  const companionFood = parseJson(submission.companionFood, []);
  const submittedBy = `${submission.firstName} ${submission.lastName}`;

  return [
    {
      id: `${submission.id}-titular`,
      submissionId: submission.id,
      firstName: submission.firstName,
      lastName: submission.lastName,
      name: submittedBy,
      food: submission.primaryFood || "Ninguna",
      role: "Titular",
      needsBus: submission.needsBus,
      allergies: submission.allergies || "",
      submittedBy,
      submittedAt: submission.createdAt,
      status: "accepted",
    },
    ...companions.map((name, index) => {
      const parsedName = splitName(name);

      return {
        id: `${submission.id}-acompanante-${index + 1}`,
        submissionId: submission.id,
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
        name,
        food: companionFood[index]?.restriction || "Ninguna",
        role: "Acompañante",
        needsBus: submission.needsBus,
        allergies: submission.allergies || "",
        submittedBy,
        submittedAt: submission.createdAt,
        status: "accepted",
      };
    }),
  ];
}

function getDeclinedRows(submissions) {
  return submissions
    .filter((submission) => !submission.attending)
    .map((submission) => ({
      id: `${submission.id}-declined`,
      submissionId: submission.id,
      firstName: submission.firstName,
      lastName: submission.lastName,
      name: `${submission.firstName} ${submission.lastName}`,
      food: "",
      role: "Titular",
      needsBus: false,
      allergies: "",
      submittedBy: `${submission.firstName} ${submission.lastName}`,
      submittedAt: submission.createdAt,
      status: "declined",
    }));
}

function getMealGroups(people) {
  return people.reduce((groups, person) => {
    const key = person.food || "Ninguna";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(person);

    return groups;
  }, {});
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function downloadCsv(rows) {
  const headers = ["RSVP Date", "Nombres", "Apellidos", "Respuesta", "Food", "Alergia", "Micro"];
  const csvRows = rows.map((row) => [
    formatDate(row.submittedAt),
    row.firstName,
    row.lastName,
    row.status === "accepted" ? "Confirmó" : "No viene",
    row.food,
    row.allergies,
    row.status === "accepted" ? (row.needsBus ? "Sí" : "No") : "",
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "rsvp-respuestas.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard({ submissions }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");
  const [busFilter, setBusFilter] = useState("all");
  const [summaryView, setSummaryView] = useState("accepted");
  const [selectedRowId, setSelectedRowId] = useState(null);

  const people = useMemo(() => submissions.flatMap(getPeopleFromSubmission), [submissions]);
  const declinedRows = useMemo(() => getDeclinedRows(submissions), [submissions]);
  const tableRows = useMemo(() => [...people, ...declinedRows], [people, declinedRows]);
  const mealGroups = useMemo(() => getMealGroups(people), [people]);
  const mealOptions = Object.keys(mealGroups);
  const selectedRow = tableRows.find((row) => row.id === selectedRowId) || null;
  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedRow?.submissionId) || null;
  const selectedSubmissionPeople = selectedSubmission ? getPeopleFromSubmission(selectedSubmission) : [];
  const acceptedCount = people.length;
  const declinedCount = declinedRows.length;
  const busCount = people.filter((person) => person.needsBus).length;
  const messages = submissions.filter((submission) => submission.message?.trim());
  const acceptedPercent =
    acceptedCount + declinedCount > 0
      ? Math.round((acceptedCount / (acceptedCount + declinedCount)) * 100)
      : 0;

  const filteredRows = tableRows.filter((row) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery = normalizedQuery
      ? `${row.name} ${row.submittedBy} ${row.food}`.toLowerCase().includes(normalizedQuery)
      : true;
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    const matchesMeal = mealFilter === "all" || row.food === mealFilter;
    const matchesBus =
      busFilter === "all" ||
      (busFilter === "yes" && row.needsBus) ||
      (busFilter === "no" && !row.needsBus);

    return matchesQuery && matchesStatus && matchesMeal && matchesBus;
  });

  const summaryNames = summaryView === "accepted" ? people : declinedRows;

  return (
    <main className={selectedRow ? "admin-dashboard has-detail" : "admin-dashboard"}>
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Panel privado</p>
            <h1>RSVP Dashboard</h1>
          </div>
          <button className="download-button" type="button" onClick={() => downloadCsv(tableRows)}>
            Descargar CSV
          </button>
        </header>

        <section className="dashboard-toolbar" aria-label="Filtros">
          <label className="search-shell">
            <span>Buscar</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre"
            />
          </label>
          <div className="filter-row">
            <label>
              Estado
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="accepted">Confirmados</option>
                <option value="declined">No confirmados</option>
              </select>
            </label>
            <label>
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
            <label>
              Micro
              <select value={busFilter} onChange={(event) => setBusFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        </section>

        <section className="dashboard-summary" aria-label="Resumen">
          <button
            className={summaryView === "accepted" ? "summary-card primary active" : "summary-card primary"}
            type="button"
            onClick={() => setSummaryView("accepted")}
          >
            <div className="donut" style={{ "--value": `${acceptedPercent}%` }} />
            <div>
              <h2>Confirmados</h2>
              <strong>{acceptedCount}</strong>
              <p>Incluye titulares y acompañantes</p>
            </div>
          </button>

          <button
            className={summaryView === "declined" ? "summary-card primary active" : "summary-card primary"}
            type="button"
            onClick={() => setSummaryView("declined")}
          >
            <div className="decline-mark">{declinedCount}</div>
            <div>
              <h2>No confirmados</h2>
              <strong>{declinedCount}</strong>
              <p>Personas que respondieron que no</p>
            </div>
          </button>

          <article className="summary-card meal-summary">
            <h2>Comidas</h2>
            {Object.entries(mealGroups).length > 0 ? (
              <ul>
                {Object.entries(mealGroups).map(([meal, names]) => (
                  <li key={meal}>
                    <button type="button" onClick={() => setMealFilter(meal)}>
                      <span>{meal}</span>
                      <strong>{names.length}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sin platos cargados</p>
            )}
          </article>
        </section>

        <section className="summary-names-panel">
          <div className="table-heading">
            <h2>{summaryView === "accepted" ? "Quiénes confirmaron" : "Quiénes no vienen"}</h2>
            <span>{summaryNames.length} nombres</span>
          </div>
          {summaryNames.length > 0 ? (
            <div className="name-chip-list">
              {summaryNames.map((row) => (
                <button
                  className={row.id === selectedRowId ? "name-chip active" : "name-chip"}
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedRowId(row.id)}
                >
                  {row.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">Todavía no hay respuestas para esta categoría.</p>
          )}
        </section>

        <section className="dashboard-table-panel">
          <div className="table-heading">
            <h2>Respuestas filtradas</h2>
            <span>
              {filteredRows.length} de {tableRows.length}
            </span>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>RSVP date</th>
                  <th>First name</th>
                  <th>Last name</th>
                  <th>Answer</th>
                  <th>Food selection</th>
                  <th>Alergia</th>
                  <th>Micro</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr className={row.id === selectedRowId ? "is-selected" : ""} key={row.id}>
                    <td>{formatDate(row.submittedAt)}</td>
                    <td>{row.firstName}</td>
                    <td>{row.lastName || "-"}</td>
                    <td>
                      <span className={row.status === "accepted" ? "answer accept" : "answer decline"}>
                        {row.status === "accepted" ? "Confirmó" : "No viene"}
                      </span>
                    </td>
                    <td>{row.food || "-"}</td>
                    <td>{row.allergies || ""}</td>
                    <td>{row.status === "accepted" ? (row.needsBus ? "Sí" : "No") : "-"}</td>
                    <td>
                      <button
                        className="details-link"
                        type="button"
                        onClick={() => setSelectedRowId(row.id)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 ? (
            <p className="dashboard-empty">No hay respuestas que coincidan con esos filtros.</p>
          ) : null}
        </section>

        <section className="meal-breakdown-panel">
          <div className="table-heading">
            <h2>Detalle por comida</h2>
            <span>{Object.keys(mealGroups).length} opciones</span>
          </div>
          <div className="meal-breakdown-grid">
            {Object.entries(mealGroups).map(([meal, names]) => (
              <article className="meal-breakdown-card" key={meal}>
                <div>
                  <h3>{meal}</h3>
                  <strong>{names.length}</strong>
                </div>
                <ul>
                  {names.map((person) => (
                    <li key={`${meal}-${person.id}`}>
                      <button type="button" onClick={() => setSelectedRowId(person.id)}>
                        {person.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="messages-panel">
          <div className="table-heading">
            <h2>Mensajes para los novios</h2>
            <span>{messages.length} mensajes</span>
          </div>

          {messages.length > 0 ? (
            <div className="message-grid">
              {messages.map((submission) => (
                <article className="message-card" key={`message-${submission.id}`}>
                  <div>
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
            <p className="dashboard-empty">Todavía no hay mensajes cargados.</p>
          )}
        </section>
      </section>

      {selectedRow && selectedSubmission ? (
        <aside className="dashboard-side" aria-label="Detalle">
          <button className="drawer-close" type="button" onClick={() => setSelectedRowId(null)}>
            Cerrar
          </button>

          <section className="side-panel">
            <div className="side-heading">
              <h2>Submission</h2>
              <span className={selectedSubmission.attending ? "answer accept" : "answer decline"}>
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
                    ? `${selectedSubmissionPeople.length} personas`
                    : "No"}
                </dd>
              </div>
            </dl>

            {selectedSubmissionPeople.length > 0 ? (
              <div className="mini-list">
                <h4>Personas en esta submission</h4>
                {selectedSubmissionPeople.map((person) => (
                  <button
                    className={person.id === selectedRowId ? "mini-row active" : "mini-row"}
                    type="button"
                    onClick={() => setSelectedRowId(person.id)}
                    key={person.id}
                  >
                    <span>{person.name}</span>
                    <small>{person.food}</small>
                  </button>
                ))}
              </div>
            ) : null}

            {selectedSubmission.allergies ? (
              <div className="side-note">
                <strong>Alergias</strong>
                <p>{selectedSubmission.allergies}</p>
              </div>
            ) : null}

            {selectedSubmission.message ? (
              <div className="side-note">
                <strong>Mensaje</strong>
                <p>{selectedSubmission.message}</p>
              </div>
            ) : null}
          </section>

          <section className="side-panel">
            <div className="side-heading">
              <h2>Respuesta</h2>
              <span className={selectedRow.status === "accepted" ? "answer accept" : "answer decline"}>
                {selectedRow.role}
              </span>
            </div>

            <h3>{selectedRow.name}</h3>
            <dl className="detail-list">
              <div>
                <dt>Estado</dt>
                <dd>{selectedRow.status === "accepted" ? "Confirmó asistencia" : "No asiste"}</dd>
              </div>
              <div>
                <dt>Comida</dt>
                <dd>{selectedRow.food || "No aplica"}</dd>
              </div>
              <div>
                <dt>Micro</dt>
                <dd>{selectedRow.status === "accepted" ? (selectedRow.needsBus ? "Sí" : "No") : "No aplica"}</dd>
              </div>
              <div>
                <dt>Respondió</dt>
                <dd>{selectedRow.submittedBy}</dd>
              </div>
            </dl>
          </section>
        </aside>
      ) : null}
    </main>
  );
}
