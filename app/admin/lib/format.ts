export function formatDate(date: string | number | Date | null | undefined): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date ?? Date.now()));
}

export function formatDateTime(date: string | number | Date | null | undefined): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date ?? Date.now()));
}
