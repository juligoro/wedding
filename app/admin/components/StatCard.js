"use client";

export default function StatCard({ label, value, hint, tone, visual, onClick, active }) {
  const className = ["stat-card", tone ? `tone-${tone}` : "", active ? "active" : ""]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {visual ? <div className="stat-visual">{visual}</div> : null}
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {hint ? <span className="stat-hint">{hint}</span> : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
}
