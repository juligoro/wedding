"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { buildGoogleCalendarUrl } from "@/lib/calendar";
import type { InviteeContext } from "@/lib/types";

const menuOptions: { value: string; labels: Record<string, string> }[] = [
  { value: "Ninguna", labels: { es: "Ninguna", en: "None" } },
  { value: "Sin gluten", labels: { es: "Sin gluten", en: "Gluten-free" } },
  { value: "Kosher", labels: { es: "Kosher", en: "Kosher" } },
  { value: "Vegetariano", labels: { es: "Vegetariano", en: "Vegetarian" } },
  { value: "Vegano", labels: { es: "Vegano", en: "Vegan" } },
  { value: "Menu infantil", labels: { es: "Menu infantil", en: "Kids menu" } },
];

const copy: Record<string, Record<string, string>> = {
  es: {
    saveError: "No pudimos guardar la confirmación.",
    busYes: "Queda anotado que necesitan micro.",
    busNo: "Queda anotado que no necesitan micro.",
    attendingSuccess:
      "¡Qué alegría que vengas!|Te enviamos un correo con la confirmación y la dirección completa.|Movilidad: {microText}",
    declinedSuccess: "Gracias por avisarnos.|Te vamos a extrañar muchísimo ese día.",
    calTitle: "Agendá la fecha",
    calGoogle: "Google Calendar",
    calApple: "Apple · Outlook",
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
    // Personalized-link mode
    whoComing: "¿Quiénes vienen?",
    whoComingNote: "Marcá quién de tu grupo va a poder acompañarnos.",
    attends: "Viene",
    notAttends: "No viene",
    mealFor: "Menú de {name}",
    contactHeading: "Tus datos de contacto",
    contactNote: "Para enviarte la confirmación y la dirección exacta.",
    extras: "Alergias y aclaraciones",
    needName: "Completá el nombre de cada invitado.",
    needContact: "Completá tu email y WhatsApp.",
    needBus: "Indicá si necesitan micro.",
  },
  en: {
    saveError: "We could not save your RSVP.",
    busYes: "We noted that you need the shuttle.",
    busNo: "We noted that you do not need the shuttle.",
    attendingSuccess:
      "Yay! We can't wait to see you.|We've just emailed you a confirmation with the full address.|Transportation: {microText}",
    declinedSuccess: "Thank you for letting us know.|We will miss you so much that day.",
    calTitle: "Save the date",
    calGoogle: "Google Calendar",
    calApple: "Apple · Outlook",
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
      "There will be an open bar, and we do not want anyone driving after drinking. We will share shuttle stop options from/to Buenos Aires City for whoever needs them.",
    busQuestion: "Do you need the shuttle? This answer applies to your full group.",
    busAccept: "Yes, we need the shuttle",
    busDecline: "No, we do not need the shuttle",
    message: "Message",
    messageLabel: "Message for the couple",
    optional: "Optional",
    sending: "Sending...",
    submit: "Send RSVP",
    details: "See details",
    // Personalized-link mode
    whoComing: "Who's coming?",
    whoComingNote: "Let us know who from your group will be able to join us.",
    attends: "Attending",
    notAttends: "Not attending",
    mealFor: "{name}'s meal",
    contactHeading: "Your contact details",
    contactNote: "So we can email your confirmation and the exact address.",
    extras: "Allergies & notes",
    needName: "Please enter each guest's name.",
    needContact: "Please enter your email and WhatsApp.",
    needBus: "Please tell us whether you need the shuttle.",
  },
};

interface MemberState {
  firstName: string;
  lastName: string;
  attending: boolean;
  food: string;
}

function format(template: string, replacements: Record<string, string | number>): string {
  return Object.entries(replacements).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
}

function getCompanionOption(locale: string, count: number): string {
  if (locale === "en") {
    return `+${count} ${count === 1 ? "guest" : "guests"}`;
  }

  return `+${count} ${count === 1 ? "acompañante" : "acompañantes"}`;
}

function SelectShell({ children }: { children: ReactNode }) {
  return (
    <span className="select-shell">
      {children}
      <svg className="select-caret" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 10 L12 15 L17 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function FoodSelect({
  name,
  label,
  required,
  locale,
  full,
}: {
  name: string;
  label: string;
  required?: boolean;
  locale: string;
  full?: boolean;
}) {
  return (
    <label className={full ? "full" : undefined}>
      <span className="field-label">{label}</span>
      <SelectShell>
        <select name={name} required={required}>
          {menuOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.labels[locale]}
            </option>
          ))}
        </select>
      </SelectShell>
    </label>
  );
}

export default function RsvpForm({
  locale = "es",
  invitee = null,
}: {
  locale?: string;
  invitee?: InviteeContext | null;
}) {
  const text = copy[locale] || copy.es;

  // --- shared state ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // --- generic (open form) state ---
  const [attendance, setAttendance] = useState("");
  const [guestCount, setGuestCount] = useState(0);

  // --- personalized-link state ---
  const [members, setMembers] = useState<MemberState[]>(() =>
    (invitee?.members ?? []).map((member) => ({
      firstName: member.firstName,
      lastName: member.lastName,
      attending: true,
      food: "Ninguna",
    })),
  );
  const [contactEmail, setContactEmail] = useState(invitee?.email ?? "");
  const [contactWhatsapp, setContactWhatsapp] = useState(invitee?.whatsapp ?? "");
  const [busChoice, setBusChoice] = useState("");
  const [allergies, setAllergies] = useState("");
  const [message, setMessage] = useState("");

  const googleCalendarUrl = buildGoogleCalendarUrl(locale);
  const icsUrl = `/api/calendar?locale=${locale}`;

  const isAttending = attendance === "si";
  const companionIndexes = useMemo(
    () => Array.from({ length: guestCount }, (_, index) => index + 1),
    [guestCount],
  );
  const anyMemberAttending = members.some((member) => member.attending);

  useEffect(() => {
    if (!isAttending) {
      setGuestCount(0);
    }
  }, [isAttending]);

  function updateMember(index: number, patch: Partial<MemberState>) {
    setMembers((prev) =>
      prev.map((member, i) => (i === index ? { ...member, ...patch } : member)),
    );
  }

  function showSuccess(attending: boolean, needsBus: boolean) {
    if (attending) {
      const microText = needsBus ? text.busYes : text.busNo;

      setSuccessMessage(format(text.attendingSuccess, { microText }));
      setShowCalendar(true);
    } else {
      setSuccessMessage(text.declinedSuccess);
      setShowCalendar(false);
    }
  }

  async function postRsvp(payload: Record<string, unknown>) {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));

      throw new Error(locale === "es" ? body.error || text.saveError : text.saveError);
    }

    return response;
  }

  async function handleInviteSubmit() {
    if (!invitee) {
      return;
    }

    const cleanMembers = members.map((member) => ({
      firstName: member.firstName.trim(),
      lastName: member.lastName.trim(),
      attending: member.attending,
      food: member.attending ? member.food : "Ninguna",
    }));

    if (cleanMembers.some((member) => !member.firstName)) {
      setErrorMessage(text.needName);
      return;
    }

    const email = contactEmail.trim();
    const whatsapp = contactWhatsapp.trim();

    if (!email || !whatsapp) {
      setErrorMessage(text.needContact);
      return;
    }

    const anyAttending = cleanMembers.some((member) => member.attending);

    if (anyAttending && busChoice !== "si" && busChoice !== "no") {
      setErrorMessage(text.needBus);
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await postRsvp({
        token: invitee.token,
        locale,
        email,
        whatsapp,
        micro: anyAttending ? busChoice : "no",
        alergias: anyAttending ? allergies.trim() : "",
        mensaje: message.trim(),
        members: cleanMembers,
      });

      showSuccess(anyAttending, busChoice === "si");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text.saveError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (invitee) {
      await handleInviteSubmit();
      return;
    }

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await postRsvp({ ...data, locale });

      localStorage.setItem("rsvp-juli-tomi", JSON.stringify(data));

      if (data.asistencia === "si") {
        showSuccess(true, data.micro === "si");
      } else {
        showSuccess(false, false);
      }

      form.reset();
      setAttendance("");
      setGuestCount(0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : text.saveError);
    } finally {
      setIsSubmitting(false);
    }
  }

  const successBlock = successMessage ? (
    <div className="success" role="status">
      <span className="success-heart" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path
            d="M12 20.5 C12 20.5 3.8 14.2 3.8 8.6 C3.8 5.7 6 3.6 8.7 3.6 C10.4 3.6 11.6 4.7 12 5.4 C12.4 4.7 13.6 3.6 15.3 3.6 C18 3.6 20.2 5.7 20.2 8.6 C20.2 14.2 12 20.5 12 20.5 Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      </span>
      <div className="success-body">
        {successMessage.split("|").map((line, index) =>
          index === 0 ? <strong key={line}>{line}</strong> : <p key={line}>{line}</p>,
        )}
        {showCalendar ? (
          <div className="success-calendar">
            <span className="success-calendar-title">{text.calTitle}</span>
            <div className="success-calendar-actions">
              <a
                className="button calendar"
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {text.calGoogle}
              </a>
              <a className="button calendar" href={icsUrl}>
                {text.calApple}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  const errorBlock = errorMessage ? (
    <div className="error" role="alert">
      {errorMessage}
    </div>
  ) : null;

  // ---- Personalized-link form (names pre-filled, per-person attendance) ----
  if (invitee) {
    const messageNum = anyMemberAttending ? "05" : "03";

    return (
      <form id="rsvpForm" className="rsvp-form" onSubmit={handleSubmit}>
        {successMessage ? null : (
          <>
            <fieldset>
              <legend>
                <span className="legend-num">01</span>
                {text.whoComing}
              </legend>
              <p className="field-note">{text.whoComingNote}</p>
              <div className="member-list">
                {members.map((member, index) => (
                  <div className="guest-card member-card" key={index}>
                    <div className="grid">
                      <label>
                        <span className="field-label">{text.firstName}</span>
                        <input
                          value={member.firstName}
                          onChange={(event) => updateMember(index, { firstName: event.target.value })}
                          required
                        />
                      </label>
                      <label>
                        <span className="field-label">{text.lastName}</span>
                        <input
                          value={member.lastName}
                          onChange={(event) => updateMember(index, { lastName: event.target.value })}
                        />
                      </label>
                    </div>
                    <div className="choice-group two">
                      <label className={`choice ${member.attending ? "is-checked" : ""}`}>
                        <input
                          type="radio"
                          name={`attend_${index}`}
                          checked={member.attending}
                          onChange={() => updateMember(index, { attending: true })}
                        />
                        <span className="choice-mark" aria-hidden="true" />
                        <span className="choice-text">{text.attends}</span>
                      </label>
                      <label className={`choice ${!member.attending ? "is-checked" : ""}`}>
                        <input
                          type="radio"
                          name={`attend_${index}`}
                          checked={!member.attending}
                          onChange={() => updateMember(index, { attending: false })}
                        />
                        <span className="choice-mark" aria-hidden="true" />
                        <span className="choice-text">{text.notAttends}</span>
                      </label>
                    </div>
                    {member.attending ? (
                      <label className="full">
                        <span className="field-label">
                          {format(text.mealFor, { name: member.firstName || `#${index + 1}` })}
                        </span>
                        <SelectShell>
                          <select
                            value={member.food}
                            onChange={(event) => updateMember(index, { food: event.target.value })}
                          >
                            {menuOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.labels[locale]}
                              </option>
                            ))}
                          </select>
                        </SelectShell>
                      </label>
                    ) : null}
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <span className="legend-num">02</span>
                {text.contactHeading}
              </legend>
              <p className="field-note">{text.contactNote}</p>
              <div className="grid">
                <label>
                  <span className="field-label">Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span className="field-label">WhatsApp</span>
                  <input
                    autoComplete="tel"
                    value={contactWhatsapp}
                    onChange={(event) => setContactWhatsapp(event.target.value)}
                    required
                  />
                </label>
              </div>
            </fieldset>

            {anyMemberAttending ? (
              <>
                <fieldset>
                  <legend>
                    <span className="legend-num">03</span>
                    {text.extras}
                  </legend>
                  <label className="full">
                    <span className="field-label">{text.allergies}</span>
                    <textarea
                      value={allergies}
                      placeholder={text.allergiesPlaceholder}
                      onChange={(event) => setAllergies(event.target.value)}
                    />
                  </label>
                </fieldset>

                <fieldset>
                  <legend>
                    <span className="legend-num">04</span>
                    {text.mobility}
                  </legend>
                  <p className="field-note">{text.mobilityNote}</p>
                  <p className="field-question">{text.busQuestion}</p>
                  <div className="choice-group two">
                    <label className={`choice ${busChoice === "si" ? "is-checked" : ""}`}>
                      <input
                        type="radio"
                        name="micro"
                        value="si"
                        checked={busChoice === "si"}
                        onChange={(event) => setBusChoice(event.target.value)}
                      />
                      <span className="choice-mark" aria-hidden="true" />
                      <span className="choice-text">{text.busAccept}</span>
                    </label>
                    <label className={`choice ${busChoice === "no" ? "is-checked" : ""}`}>
                      <input
                        type="radio"
                        name="micro"
                        value="no"
                        checked={busChoice === "no"}
                        onChange={(event) => setBusChoice(event.target.value)}
                      />
                      <span className="choice-mark" aria-hidden="true" />
                      <span className="choice-text">{text.busDecline}</span>
                    </label>
                  </div>
                </fieldset>
              </>
            ) : null}

            <fieldset>
              <legend>
                <span className="legend-num">{messageNum}</span>
                {text.message}
              </legend>
              <label>
                <span className="field-label">{text.messageLabel}</span>
                <textarea
                  value={message}
                  placeholder={text.optional}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </label>
            </fieldset>

            <div className="form-actions">
              <button className="button submit" type="submit" disabled={isSubmitting}>
                <span>{isSubmitting ? text.sending : text.submit}</span>
              </button>
              <a className="button secondary" href="#detalles">
                {text.details}
              </a>
            </div>
          </>
        )}

        {successBlock}
        {errorBlock}
      </form>
    );
  }

  // ---- Open form (no personalized link) ----
  return (
    <form id="rsvpForm" className="rsvp-form" onSubmit={handleSubmit}>
      <fieldset>
        <legend>
          <span className="legend-num">01</span>
          {text.personalData}
        </legend>
        <div className="grid">
          <label>
            <span className="field-label">{text.firstName}</span>
            <input name="nombre" autoComplete="given-name" required />
          </label>
          <label>
            <span className="field-label">{text.lastName}</span>
            <input name="apellido" autoComplete="family-name" required />
          </label>
          <label>
            <span className="field-label">Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            <span className="field-label">WhatsApp</span>
            <input name="whatsapp" autoComplete="tel" required />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <span className="legend-num">02</span>
          {text.attendance}
        </legend>
        <div className="choice-group two">
          <label className={`choice ${attendance === "si" ? "is-checked" : ""}`}>
            <input
              type="radio"
              name="asistencia"
              value="si"
              required
              checked={attendance === "si"}
              onChange={(event) => setAttendance(event.target.value)}
            />
            <span className="choice-mark" aria-hidden="true" />
            <span className="choice-text">{text.accept}</span>
          </label>
          <label className={`choice ${attendance === "no" ? "is-checked" : ""}`}>
            <input
              type="radio"
              name="asistencia"
              value="no"
              checked={attendance === "no"}
              onChange={(event) => setAttendance(event.target.value)}
            />
            <span className="choice-mark" aria-hidden="true" />
            <span className="choice-text">{text.decline}</span>
          </label>
        </div>
      </fieldset>

      {isAttending ? (
        <div className="rsvp-conditional">
          <fieldset id="guestSection">
            <legend>
              <span className="legend-num">03</span>
              {text.guests}
            </legend>
            <div className="grid">
              <label className="full">
                <span className="field-label">{text.guestCount}</span>
                <SelectShell>
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
                </SelectShell>
              </label>
            </div>

            {companionIndexes.length > 0 ? (
              <div className="guest-card">
                <h4>{text.companions}</h4>
                <div className="grid">
                  {companionIndexes.map((index) => (
                    <label key={index}>
                      <span className="field-label">{format(text.companionName, { index })}</span>
                      <input name={`acompanante_${index}`} required />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </fieldset>

          <fieldset id="foodSection">
            <legend>
              <span className="legend-num">04</span>
              {text.food}
            </legend>
            <div className="grid">
              <FoodSelect name="comida_titular" label={text.primaryFood} required locale={locale} full />
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
              <span className="field-label">{text.allergies}</span>
              <textarea name="alergias" placeholder={text.allergiesPlaceholder} />
            </label>
          </fieldset>

          <fieldset id="mobilitySection">
            <legend>
              <span className="legend-num">05</span>
              {text.mobility}
            </legend>
            <p className="field-note">{text.mobilityNote}</p>
            <p className="field-question">{text.busQuestion}</p>
            <div className="choice-group two">
              <label className="choice">
                <input type="radio" name="micro" value="si" required />
                <span className="choice-mark" aria-hidden="true" />
                <span className="choice-text">{text.busAccept}</span>
              </label>
              <label className="choice">
                <input type="radio" name="micro" value="no" required />
                <span className="choice-mark" aria-hidden="true" />
                <span className="choice-text">{text.busDecline}</span>
              </label>
            </div>
          </fieldset>
        </div>
      ) : null}

      <fieldset>
        <legend>
          <span className="legend-num">{isAttending ? "06" : "03"}</span>
          {text.message}
        </legend>
        <label>
          <span className="field-label">{text.messageLabel}</span>
          <textarea name="mensaje" placeholder={text.optional} />
        </label>
      </fieldset>

      <div className="form-actions">
        <button className="button submit" type="submit" disabled={isSubmitting}>
          <span>{isSubmitting ? text.sending : text.submit}</span>
        </button>
        <a className="button secondary" href="#detalles">
          {text.details}
        </a>
      </div>

      {successBlock}
      {errorBlock}
    </form>
  );
}
