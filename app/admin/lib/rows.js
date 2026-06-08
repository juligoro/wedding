import { parseJson } from "@/lib/guests";

export function getRows(submissions, tableAssignments, guestEdits = {}) {
  return submissions.flatMap((submission) =>
    submission.guests.map((guest) => {
      const tableId = tableAssignments[guest.id] ?? guest.tableId;
      const edit = guestEdits[guest.id] || {};
      const firstName = edit.firstName ?? guest.firstName;
      const lastName = edit.lastName ?? (guest.lastName || "");
      const fullName = edit.fullName ?? guest.fullName;

      return {
        id: guest.id,
        submissionId: submission.id,
        firstName,
        lastName,
        name: fullName,
        food: edit.food ?? (guest.food || ""),
        role: guest.role,
        needsBus: edit.needsBus ?? guest.needsBus,
        allergies: edit.allergies ?? (guest.allergies || ""),
        email: edit.email ?? guest.email,
        whatsapp: edit.whatsapp ?? guest.whatsapp,
        tags: parseJson(guest.tags, []),
        submittedBy: `${submission.firstName} ${submission.lastName}`,
        submittedAt: submission.createdAt,
        attending: edit.attending ?? guest.attending,
        tableId,
        tableName: guest.table?.id === tableId ? guest.table.name : "",
      };
    }),
  );
}

export function getMealGroups(rows) {
  return rows
    .filter((row) => row.attending)
    .reduce((groups, person) => {
      const key = person.food || "Ninguna";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(person);

      return groups;
    }, {});
}

export function filterAndSortRows(rows, { query, statusFilter, mealFilter, busFilter }) {
  return rows
    .filter((row) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery = normalizedQuery
        ? `${row.name} ${row.submittedBy} ${row.food} ${row.email} ${row.whatsapp} ${row.tableName} ${row.tags.join(" ")}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "accepted" && row.attending) ||
        (statusFilter === "declined" && !row.attending);
      const matchesMeal = mealFilter === "all" || row.food === mealFilter;
      const matchesBus =
        busFilter === "all" ||
        (busFilter === "yes" && row.needsBus) ||
        (busFilter === "no" && !row.needsBus);

      return matchesQuery && matchesStatus && matchesMeal && matchesBus;
    })
    .sort((a, b) => {
      if (a.attending !== b.attending) {
        return a.attending ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
}
