"use client";

import type { CSSProperties } from "react";

import { useAdmin } from "../AdminContext";
import { formatDate } from "../lib/format";
import StatCard from "./StatCard";

export default function OverviewView() {
  const {
    acceptedCount,
    declinedCount,
    acceptedPercent,
    busCount,
    unassignedRows,
    messages,
    mealGroups,
    summaryView,
    setSummaryView,
    summaryNames,
    setSelectedRowId,
    setActiveSection,
    setMealFilter,
    setStatusFilter,
  } = useAdmin();

  function openMeal(meal: string) {
    setMealFilter(meal);
    setStatusFilter("accepted");
    setActiveSection("guests");
  }

  return (
    <div className="view view-overview">
      <header className="view-header">
        <h2>Resumen</h2>
      </header>

      <div className="stat-grid">
        <StatCard
          label="Confirmados"
          value={acceptedCount}
          hint={`${acceptedPercent}% de aceptación`}
          tone="ok"
          visual={<div className="donut" style={{ "--value": `${acceptedPercent}%` } as CSSProperties} />}
        />
        <StatCard label="No vienen" value={declinedCount} hint="Respondieron que no" tone="no" />
        <StatCard
          label="Sin mesa"
          value={unassignedRows.length}
          hint="Confirmados sin asignar"
          onClick={() => setActiveSection("seating")}
        />
        <StatCard label="Necesitan micro" value={busCount} hint="Personas confirmadas" />
        <StatCard
          label="Mensajes"
          value={messages.length}
          hint="Para los novios"
          onClick={() => setActiveSection("messages")}
        />
      </div>

      <div className="overview-columns">
        <section className="panel">
          <div className="panel-head">
            <h3>Detalle por comida</h3>
            <span className="muted">{Object.keys(mealGroups).length} opciones</span>
          </div>
          {Object.keys(mealGroups).length > 0 ? (
            <ul className="meal-list">
              {Object.entries(mealGroups).map(([meal, names]) => (
                <li key={meal}>
                  <button type="button" onClick={() => openMeal(meal)}>
                    <span>{meal}</span>
                    <strong>{names.length}</strong>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Sin platos cargados.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="segmented">
              <button
                type="button"
                className={summaryView === "accepted" ? "active" : ""}
                onClick={() => setSummaryView("accepted")}
              >
                Confirmaron
              </button>
              <button
                type="button"
                className={summaryView === "declined" ? "active" : ""}
                onClick={() => setSummaryView("declined")}
              >
                No vienen
              </button>
            </div>
            <span className="muted">{summaryNames.length} nombres</span>
          </div>
          {summaryNames.length > 0 ? (
            <div className="chip-list">
              {summaryNames.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="chip"
                  onClick={() => setSelectedRowId(row.id)}
                >
                  {row.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="empty">Todavía no hay respuestas para esta categoría.</p>
          )}
        </section>
      </div>

      {messages.length > 0 ? (
        <section className="panel">
          <div className="panel-head">
            <h3>Últimos mensajes</h3>
            <button type="button" className="link-button" onClick={() => setActiveSection("messages")}>
              Ver todos
            </button>
          </div>
          <div className="message-grid">
            {messages.slice(0, 3).map((submission) => (
              <article className="message-card" key={`overview-message-${submission.id}`}>
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
        </section>
      ) : null}
    </div>
  );
}
