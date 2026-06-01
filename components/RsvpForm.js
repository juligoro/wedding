"use client";

import { useEffect, useMemo, useState } from "react";

const menuOptions = ["Ninguna", "Sin gluten", "Kosher", "Vegetariano", "Vegano", "Menu infantil"];

function FoodSelect({ name, label, required }) {
  return (
    <label>
      {label}
      <select name={name} required={required}>
        {menuOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function RsvpForm() {
  const [attendance, setAttendance] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const isAttending = attendance === "si";
  const companionIndexes = useMemo(
    () => Array.from({ length: guestCount }, (_, index) => index + 1),
    [guestCount],
  );

  useEffect(() => {
    if (!isAttending) {
      setGuestCount(0);
    }
  }, [isAttending]);

  function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    localStorage.setItem("rsvp-juli-tomi", JSON.stringify(data));

    if (data.asistencia === "si") {
      const microText =
        data.micro === "si"
          ? "Queda anotado que necesitan micro."
          : "Queda anotado que no necesitan micro.";

      setSuccessMessage(
        `Gracias por confirmar.|Te vamos a enviar la dirección exacta y los detalles finales más cerca de la fecha.|Movilidad: ${microText}`,
      );
    } else {
      setSuccessMessage("Gracias por avisarnos.|Vamos a extrañarte mucho ese día.");
    }
  }

  return (
    <form id="rsvpForm" onSubmit={handleSubmit}>
      <fieldset>
        <legend>Datos personales</legend>
        <div className="grid">
          <label>
            Nombre
            <input name="nombre" autoComplete="given-name" required />
          </label>
          <label>
            Apellido
            <input name="apellido" autoComplete="family-name" required />
          </label>
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            WhatsApp
            <input name="whatsapp" autoComplete="tel" required />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Asistencia</legend>
        <div className="choice-group">
          <label className="choice">
            <input
              type="radio"
              name="asistencia"
              value="si"
              required
              checked={attendance === "si"}
              onChange={(event) => setAttendance(event.target.value)}
            />
            Sí, confirmo asistencia
          </label>
          <label className="choice">
            <input
              type="radio"
              name="asistencia"
              value="no"
              checked={attendance === "no"}
              onChange={(event) => setAttendance(event.target.value)}
            />
            No voy a poder asistir
          </label>
        </div>
      </fieldset>

      {isAttending ? (
        <>
          <fieldset id="guestSection">
            <legend>Invitados</legend>
            <div className="grid">
              <label className="full">
                Cantidad de acompañantes
                <select
                  id="guestCount"
                  name="acompanantes"
                  value={guestCount}
                  required
                  onChange={(event) => setGuestCount(Number(event.target.value))}
                >
                  <option value="0">Solo yo</option>
                  <option value="1">+1 acompañante</option>
                  <option value="2">+2 acompañantes</option>
                  <option value="3">+3 acompañantes</option>
                  <option value="4">+4 acompañantes</option>
                </select>
              </label>
            </div>

            {companionIndexes.length > 0 ? (
              <div className="guest-card">
                <h4>Acompañantes</h4>
                <div className="grid">
                  {companionIndexes.map((index) => (
                    <label key={index}>
                      Nombre y Apellido de acompañante {index}
                      <input name={`acompanante_${index}`} required />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </fieldset>

          <fieldset id="foodSection">
            <legend>Restricciones alimentarias</legend>
            <div className="grid">
              <FoodSelect
                name="comida_titular"
                label="Restricción alimentaria de quien confirma"
                required
              />
            </div>

            {companionIndexes.length > 0 ? (
              <div className="guest-card">
                <h4>Alimentación por acompañante</h4>
                <div className="grid">
                  {companionIndexes.map((index) => (
                    <FoodSelect
                      key={index}
                      name={`comida_acompanante_${index}`}
                      label={`Restricción alimentaria de acompañante ${index}`}
                      required
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <label className="full">
              Alergias o aclaraciones adicionales
              <textarea
                name="alergias"
                placeholder="Escribí cualquier alergia o detalle importante."
              />
            </label>
          </fieldset>

          <fieldset id="mobilitySection">
            <legend>Movilidad</legend>
            <p className="note">
              Hay barra libre y no queremos que manejes si tomaste. Vamos a compartir las
              opciones de paradas del micro a CABA para quienes lo necesiten.
            </p>
            <p>¿Necesitan micro? Esta respuesta aplica para todos los acompañantes juntos.</p>
            <div className="choice-group">
              <label className="choice">
                <input type="radio" name="micro" value="si" required />
                Sí, necesitamos micro
              </label>
              <label className="choice">
                <input type="radio" name="micro" value="no" required />
                No necesitamos micro
              </label>
            </div>
          </fieldset>
        </>
      ) : null}

      <fieldset>
        <legend>Mensaje</legend>
        <label>
          Mensaje para los novios
          <textarea name="mensaje" placeholder="Opcional" />
        </label>
      </fieldset>

      <div className="form-actions">
        <button className="button submit" type="submit">
          Enviar RSVP
        </button>
        <a className="button secondary" href="#detalles-title">
          Ver detalles
        </a>
      </div>

      {successMessage ? (
        <div className="success" role="status">
          {successMessage.split("|").map((line, index) =>
            index === 0 ? (
              <strong key={line}>{line}</strong>
            ) : (
              <p key={line}>{line}</p>
            ),
          )}
        </div>
      ) : null}
    </form>
  );
}
