"use client";

import { useEffect, useMemo, useState } from "react";

const menuOptions = [
  { value: "Ninguna", labels: { es: "Ninguna", en: "None" } },
  { value: "Sin gluten", labels: { es: "Sin gluten", en: "Gluten-free" } },
  { value: "Kosher", labels: { es: "Kosher", en: "Kosher" } },
  { value: "Vegetariano", labels: { es: "Vegetariano", en: "Vegetarian" } },
  { value: "Vegano", labels: { es: "Vegano", en: "Vegan" } },
  { value: "Menu infantil", labels: { es: "Menu infantil", en: "Kids menu" } },
];

const copy = {
  es: {
    saveError: "No pudimos guardar la confirmación.",
    busYes: "Queda anotado que necesitan micro.",
    busNo: "Queda anotado que no necesitan micro.",
    attendingSuccess:
      "Gracias por confirmar.|Te vamos a enviar la dirección exacta y los detalles finales más cerca de la fecha.|Movilidad: {microText}",
    declinedSuccess: "Gracias por avisarnos.|Vamos a extrañarte mucho ese día.",
    personalData: "Datos personales",
    firstName: "Nombre",
    lastName: "Apellido",
    attendance: "Asistencia",
    accept: "Sí, confirmo asistencia",
    decline: "No voy a poder asistir",
    guests: "Invitados",
    guestCount: "Cantidad de acompañantes",
    onlyMe: "Solo yo",
    companions: "Acompañantes",
    companionName: "Nombre y Apellido de acompañante {index}",
    food: "Restricciones alimentarias",
    primaryFood: "Restricción alimentaria de quien confirma",
    companionFoodGroup: "Alimentación por acompañante",
    companionFood: "Restricción alimentaria de acompañante {index}",
    allergies: "Alergias o aclaraciones adicionales",
    allergiesPlaceholder: "Escribí cualquier alergia o detalle importante.",
    mobility: "Movilidad",
    mobilityNote:
      "Hay barra libre y no queremos que manejes si tomaste. Vamos a compartir las opciones de paradas del micro a CABA para quienes lo necesiten.",
    busQuestion: "¿Necesitan micro? Esta respuesta aplica para todos los acompañantes juntos.",
    busAccept: "Sí, necesitamos micro",
    busDecline: "No necesitamos micro",
    message: "Mensaje",
    messageLabel: "Mensaje para los novios",
    optional: "Opcional",
    sending: "Enviando...",
    submit: "Enviar RSVP",
    details: "Ver detalles",
  },
  en: {
    saveError: "We could not save your RSVP.",
    busYes: "We noted that you need the shuttle.",
    busNo: "We noted that you do not need the shuttle.",
    attendingSuccess:
      "Thank you for confirming.|We will email you the exact address and final details closer to the date.|Transportation: {microText}",
    declinedSuccess: "Thank you for letting us know.|We will miss you that day.",
    personalData: "Personal information",
    firstName: "First name",
    lastName: "Last name",
    attendance: "Attendance",
    accept: "Yes, I will attend",
    decline: "I will not be able to attend",
    guests: "Guests",
    guestCount: "Number of guests",
    onlyMe: "Just me",
    companions: "Guests",
    companionName: "Guest {index} full name",
    food: "Dietary restrictions",
    primaryFood: "Dietary restriction for the person filling out this form",
    companionFoodGroup: "Dietary restrictions by guest",
    companionFood: "Dietary restriction for guest {index}",
    allergies: "Allergies or additional notes",
    allergiesPlaceholder: "Write any allergies or important details.",
    mobility: "Transportation",
    mobilityNote:
      "There will be an open bar, and we do not want anyone driving after drinking. We will share shuttle stop options from Buenos Aires City for whoever needs them.",
    busQuestion: "Do you need the shuttle? This answer applies to your full group.",
    busAccept: "Yes, we need the shuttle",
    busDecline: "No, we do not need the shuttle",
    message: "Message",
    messageLabel: "Message for the couple",
    optional: "Optional",
    sending: "Sending...",
    submit: "Send RSVP",
    details: "See details",
  },
};

function format(template, replacements) {
  return Object.entries(replacements).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}

function getCompanionOption(locale, count) {
  if (locale === "en") {
    return `+${count} ${count === 1 ? "guest" : "guests"}`;
  }

  return `+${count} ${count === 1 ? "acompañante" : "acompañantes"}`;
}

function FoodSelect({ name, label, required, locale }) {
  return (
    <label>
      {label}
      <select name={name} required={required}>
        {menuOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.labels[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function RsvpForm({ locale = "es" }) {
  const text = copy[locale] || copy.es;
  const [attendance, setAttendance] = useState("");
  const [guestCount, setGuestCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(locale === "es" ? body.error || text.saveError : text.saveError);
      }

      localStorage.setItem("rsvp-juli-tomi", JSON.stringify(data));

      if (data.asistencia === "si") {
        const microText =
          data.micro === "si"
            ? text.busYes
            : text.busNo;

        setSuccessMessage(
          format(text.attendingSuccess, { microText }),
        );
      } else {
        setSuccessMessage(text.declinedSuccess);
      }

      form.reset();
      setAttendance("");
      setGuestCount(0);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form id="rsvpForm" onSubmit={handleSubmit}>
      <fieldset>
        <legend>{text.personalData}</legend>
        <div className="grid">
          <label>
            {text.firstName}
            <input name="nombre" autoComplete="given-name" required />
          </label>
          <label>
            {text.lastName}
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
        <legend>{text.attendance}</legend>
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
            {text.accept}
          </label>
          <label className="choice">
            <input
              type="radio"
              name="asistencia"
              value="no"
              checked={attendance === "no"}
              onChange={(event) => setAttendance(event.target.value)}
            />
            {text.decline}
          </label>
        </div>
      </fieldset>

      {isAttending ? (
        <>
          <fieldset id="guestSection">
            <legend>{text.guests}</legend>
            <div className="grid">
              <label className="full">
                {text.guestCount}
                <select
                  id="guestCount"
                  name="acompanantes"
                  value={guestCount}
                  required
                  onChange={(event) => setGuestCount(Number(event.target.value))}
                >
                  <option value="0">{text.onlyMe}</option>
                  <option value="1">{getCompanionOption(locale, 1)}</option>
                  <option value="2">{getCompanionOption(locale, 2)}</option>
                  <option value="3">{getCompanionOption(locale, 3)}</option>
                  <option value="4">{getCompanionOption(locale, 4)}</option>
                </select>
              </label>
            </div>

            {companionIndexes.length > 0 ? (
              <div className="guest-card">
                <h4>{text.companions}</h4>
                <div className="grid">
                  {companionIndexes.map((index) => (
                    <label key={index}>
                      {format(text.companionName, { index })}
                      <input name={`acompanante_${index}`} required />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </fieldset>

          <fieldset id="foodSection">
            <legend>{text.food}</legend>
            <div className="grid">
              <FoodSelect
                name="comida_titular"
                label={text.primaryFood}
                required
                locale={locale}
              />
            </div>

            {companionIndexes.length > 0 ? (
              <div className="guest-card">
                <h4>{text.companionFoodGroup}</h4>
                <div className="grid">
                  {companionIndexes.map((index) => (
                    <FoodSelect
                      key={index}
                      name={`comida_acompanante_${index}`}
                      label={format(text.companionFood, { index })}
                      required
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <label className="full">
              {text.allergies}
              <textarea
                name="alergias"
                placeholder={text.allergiesPlaceholder}
              />
            </label>
          </fieldset>

          <fieldset id="mobilitySection">
            <legend>{text.mobility}</legend>
            <p className="note">{text.mobilityNote}</p>
            <p>{text.busQuestion}</p>
            <div className="choice-group">
              <label className="choice">
                <input type="radio" name="micro" value="si" required />
                {text.busAccept}
              </label>
              <label className="choice">
                <input type="radio" name="micro" value="no" required />
                {text.busDecline}
              </label>
            </div>
          </fieldset>
        </>
      ) : null}

      <fieldset>
        <legend>{text.message}</legend>
        <label>
          {text.messageLabel}
          <textarea name="mensaje" placeholder={text.optional} />
        </label>
      </fieldset>

      <div className="form-actions">
        <button className="button submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? text.sending : text.submit}
        </button>
        <a className="button secondary" href="#detalles-title">
          {text.details}
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

      {errorMessage ? (
        <div className="error" role="alert">
          {errorMessage}
        </div>
      ) : null}
    </form>
  );
}
