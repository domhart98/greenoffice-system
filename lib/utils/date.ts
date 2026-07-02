export function parseQBDate(value: string | undefined | null) {
  if (!value) return null;

  const [month, day, year] = value.split("/");

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function parseQBDateTime(value: string | undefined | null) {
  if (!value) return null;

  const [datePart, timePart, meridiem] = value.split(" ");

  const [month, day, year] = datePart.split("/");

  let [hour, minute, second] = timePart.split(":").map(Number);

  if (meridiem === "PM" && hour !== 12) {
    hour += 12;
  }

  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(
    2,
    "0"
  )} ${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )}:${String(second).padStart(2, "0")}`;
}