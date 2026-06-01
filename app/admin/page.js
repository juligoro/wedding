import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  }).format(date);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getPeopleFromRsvp(rsvp) {
  if (!rsvp.attending) {
    return [];
  }

  const companions = parseJson(rsvp.companions, []);
  const companionFood = parseJson(rsvp.companionFood, []);

  return [
    {
      id: `${rsvp.id}-titular`,
      submissionId: rsvp.id,
      firstName: rsvp.firstName,
      lastName: rsvp.lastName,
      name: `${rsvp.firstName} ${rsvp.lastName}`,
      food: rsvp.primaryFood || "Ninguna",
      role: "Titular",
      needsBus: rsvp.needsBus,
      submittedBy: `${rsvp.firstName} ${rsvp.lastName}`,
      submittedAt: rsvp.createdAt,
    },
    ...companions.map((name, index) => {
      const [firstName = name, ...lastNameParts] = name.split(" ");

      return {
        id: `${rsvp.id}-acompanante-${index + 1}`,
        submissionId: rsvp.id,
        firstName,
        lastName: lastNameParts.join(" "),
        name,
        food: companionFood[index]?.restriction || "Ninguna",
        role: "Acompañante",
        needsBus: rsvp.needsBus,
        submittedBy: `${rsvp.firstName} ${rsvp.lastName}`,
        submittedAt: rsvp.createdAt,
      };
    }),
  ];
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

function getSubmissionPeople(rsvp) {
  return getPeopleFromRsvp(rsvp);
}

export default async function AdminPage({ searchParams }) {
  const params = await searchParams;
  const rsvps = await prisma.rsvp.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const people = rsvps.flatMap(getPeopleFromRsvp);
  const mealGroups = getMealGroups(people);
  const acceptedCount = people.length;
  const declinedCount = rsvps.filter((rsvp) => !rsvp.attending).length;
  const busCount = people.filter((person) => person.needsBus).length;
  const selectedSubmission =
    rsvps.find((rsvp) => String(rsvp.id) === String(params?.submission)) || rsvps[0] || null;
  const selectedPerson =
    people.find((person) => person.id === params?.person) ||
    (selectedSubmission ? getSubmissionPeople(selectedSubmission)[0] : null) ||
    people[0] ||
    null;
  const selectedSubmissionPeople = selectedSubmission ? getSubmissionPeople(selectedSubmission) : [];
  const acceptedPercent =
    acceptedCount + declinedCount > 0
      ? Math.round((acceptedCount / (acceptedCount + declinedCount)) * 100)
      : 0;

  return (
    <main className="admin-dashboard">
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Panel privado</p>
            <h1>RSVP Dashboard</h1>
          </div>
          <div className="dashboard-actions">
            <Link className="dashboard-button active" href="/admin">
              Todos
            </Link>
            <span className="dashboard-button muted">Mock sin login</span>
          </div>
        </header>

        <section className="dashboard-toolbar" aria-label="Filtros">
          <div className="search-shell">Buscar por nombre</div>
          <div className="segmented-control">
            <span>Aceptan {acceptedCount}</span>
            <span>Declinan {declinedCount}</span>
          </div>
        </section>

        <section className="dashboard-summary" aria-label="Resumen">
          <article className="summary-card">
            <div className="donut" style={{ "--value": `${acceptedPercent}%` }} />
            <div>
              <h2>Main RSVP</h2>
              <p>
                <strong>{acceptedCount}</strong> confirmados
              </p>
              <p>
                <strong>{declinedCount}</strong> respuestas negativas
              </p>
            </div>
          </article>

          <article className="summary-card compact">
            <h2>Micro</h2>
            <strong>{busCount}</strong>
            <p>personas anotadas</p>
          </article>

          <article className="summary-card meal-summary">
            <h2>Comidas</h2>
            {Object.entries(mealGroups).length > 0 ? (
              <ul>
                {Object.entries(mealGroups).map(([meal, names]) => (
                  <li key={meal}>
                    <span>{meal}</span>
                    <strong>{names.length}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sin platos cargados</p>
            )}
          </article>
        </section>

        <section className="dashboard-table-panel">
          <div className="table-heading">
            <h2>Respuestas</h2>
            <span>{people.length} personas confirmadas</span>
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
                  <th>Micro</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr
                    className={person.id === selectedPerson?.id ? "is-selected" : ""}
                    key={person.id}
                  >
                    <td>{formatDate(person.submittedAt)}</td>
                    <td>{person.firstName}</td>
                    <td>{person.lastName || "-"}</td>
                    <td>
                      <span className="answer accept">Accept</span>
                    </td>
                    <td>{person.food}</td>
                    <td>{person.needsBus ? "Sí" : "No"}</td>
                    <td>
                      <Link
                        className="details-link"
                        href={`/admin?submission=${person.submissionId}&person=${person.id}`}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}

                {rsvps
                  .filter((rsvp) => !rsvp.attending)
                  .map((rsvp) => (
                    <tr
                      className={rsvp.id === selectedSubmission?.id ? "is-selected" : ""}
                      key={`declined-${rsvp.id}`}
                    >
                      <td>{formatDate(rsvp.createdAt)}</td>
                      <td>{rsvp.firstName}</td>
                      <td>{rsvp.lastName}</td>
                      <td>
                        <span className="answer decline">Decline</span>
                      </td>
                      <td>-</td>
                      <td>-</td>
                      <td>
                        <Link className="details-link" href={`/admin?submission=${rsvp.id}`}>
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {rsvps.length === 0 ? <p className="dashboard-empty">Todavía no hay respuestas.</p> : null}
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
                      <Link href={`/admin?submission=${person.submissionId}&person=${person.id}`}>
                        {person.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </section>

      <aside className="dashboard-side" aria-label="Detalle">
        <section className="event-panel">
          <h2>Juli & Tomi</h2>
          <dl>
            <div>
              <dt>Event name</dt>
              <dd>Casamiento</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>6 de diciembre de 2026</dd>
            </div>
            <div>
              <dt>Respondants</dt>
              <dd>
                {acceptedCount} coming / {declinedCount} declined
              </dd>
            </div>
          </dl>
        </section>

        <section className="side-panel">
          <div className="side-heading">
            <h2>Submission</h2>
            {selectedSubmission ? (
              <span className={selectedSubmission.attending ? "answer accept" : "answer decline"}>
                {selectedSubmission.attending ? "Accept" : "Decline"}
              </span>
            ) : null}
          </div>

          {selectedSubmission ? (
            <>
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
                    <Link
                      className={person.id === selectedPerson?.id ? "mini-row active" : "mini-row"}
                      href={`/admin?submission=${selectedSubmission.id}&person=${person.id}`}
                      key={person.id}
                    >
                      <span>{person.name}</span>
                      <small>{person.food}</small>
                    </Link>
                  ))}
                </div>
              ) : null}

              {selectedSubmission.message ? (
                <div className="side-note">
                  <strong>Mensaje</strong>
                  <p>{selectedSubmission.message}</p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="dashboard-empty">Seleccioná una submission.</p>
          )}
        </section>

        <section className="side-panel">
          <div className="side-heading">
            <h2>Respuesta</h2>
            {selectedPerson ? <span className="answer accept">{selectedPerson.role}</span> : null}
          </div>

          {selectedPerson ? (
            <>
              <h3>{selectedPerson.name}</h3>
              <dl className="detail-list">
                <div>
                  <dt>Comida</dt>
                  <dd>{selectedPerson.food}</dd>
                </div>
                <div>
                  <dt>Micro</dt>
                  <dd>{selectedPerson.needsBus ? "Sí" : "No"}</dd>
                </div>
                <div>
                  <dt>Respondió</dt>
                  <dd>{selectedPerson.submittedBy}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="dashboard-empty">Seleccioná una respuesta.</p>
          )}
        </section>
      </aside>
    </main>
  );
}
