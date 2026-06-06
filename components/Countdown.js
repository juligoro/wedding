"use client";

import { useEffect, useMemo, useState } from "react";

const weddingTime = new Date("2026-12-06T17:00:00.000Z").getTime();

const labels = {
  es: {
    kicker: "Cuenta regresiva",
    countdown: "Cuenta regresiva para el casamiento",
    done: "¡Llegó el día!",
    days: "días",
    hours: "horas",
    minutes: "minutos",
    seconds: "segundos",
  },
  en: {
    kicker: "Counting down",
    countdown: "Wedding countdown",
    done: "The day is here!",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
  },
};

function getRemaining() {
  const total = Math.max(0, weddingTime - Date.now());

  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}

export default function Countdown({ locale = "es" }) {
  const text = labels[locale] || labels.es;
  const [remaining, setRemaining] = useState(null);
  const units = useMemo(
    () => [
      ["days", remaining?.days],
      ["hours", remaining?.hours],
      ["minutes", remaining?.minutes],
      ["seconds", remaining?.seconds],
    ],
    [remaining],
  );

  useEffect(() => {
    setRemaining(getRemaining());

    const timer = window.setInterval(() => {
      setRemaining(getRemaining());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (remaining?.total === 0) {
    return <p className="countdown-done">{text.done}</p>;
  }

  return (
    <div className="countdown-wrap">
      <span className="countdown-kicker">{text.kicker}</span>
      <div className="countdown" aria-label={text.countdown}>
        {units.map(([unit, value], i) => (
          <div className="countdown-unit" key={unit}>
            <strong key={value === undefined ? "x" : value}>
              {value === undefined ? "--" : String(value).padStart(2, "0")}
            </strong>
            <span>{text[unit]}</span>
            {i < units.length - 1 ? <i className="countdown-sep" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
