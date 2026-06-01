export function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function splitName(name) {
  const [firstName = name, ...lastNameParts] = name.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
}

export function buildGuestsFromRsvp(rsvp) {
  if (!rsvp.attending) {
    return [
      {
        firstName: rsvp.firstName,
        lastName: rsvp.lastName,
        fullName: `${rsvp.firstName} ${rsvp.lastName}`,
        role: "Titular",
        attending: false,
        food: null,
        allergies: null,
        needsBus: null,
        email: rsvp.email,
        whatsapp: rsvp.whatsapp,
      },
    ];
  }

  const companions = parseJson(rsvp.companions, []);
  const companionFood = parseJson(rsvp.companionFood, []);

  return [
    {
      firstName: rsvp.firstName,
      lastName: rsvp.lastName,
      fullName: `${rsvp.firstName} ${rsvp.lastName}`,
      role: "Titular",
      attending: true,
      food: rsvp.primaryFood || "Ninguna",
      allergies: rsvp.allergies || null,
      needsBus: rsvp.needsBus,
      email: rsvp.email,
      whatsapp: rsvp.whatsapp,
    },
    ...companions.map((name, index) => {
      const parsedName = splitName(name);

      return {
        firstName: parsedName.firstName,
        lastName: parsedName.lastName || null,
        fullName: name,
        role: "Acompañante",
        attending: true,
        food: companionFood[index]?.restriction || "Ninguna",
        allergies: rsvp.allergies || null,
        needsBus: rsvp.needsBus,
        email: rsvp.email,
        whatsapp: rsvp.whatsapp,
      };
    }),
  ];
}
