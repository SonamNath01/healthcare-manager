

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function formatDateLabel(isoDate) {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatTimeLabel(time24) {
  const [hours, minutes] = time24.split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function isTodayOrFuture(isoDate) {
  return isoDate.slice(0, 10) >= toISODate(new Date());
}

export function formatDatePill(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" });
  return { weekday, day: date.getUTCDate() };
}
