const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseDateOnly(dateStr) {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  if (formatDateOnly(date) !== dateStr) {
    return null;
  }
  return date;
}
function formatDateOnly(date) {
  return date.toISOString().split("T")[0];
}

function todayDateOnlyUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function isPastDate(date) {
  return date < todayDateOnlyUTC();
}

module.exports = {
  TIME_REGEX,
  timeToMinutes,
  minutesToTime,
  parseDateOnly,
  formatDateOnly,
  todayDateOnlyUTC,
  isPastDate,
};
