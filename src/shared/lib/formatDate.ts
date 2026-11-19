const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

/** `09:18` for today, or `Nov 12, 09:18` for any other day. */
export function formatTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  return isSameDay(date, now) ? timeFormatter.format(date) : dateTimeFormatter.format(date);
}

/** `today`, `yesterday`, or `on Nov 12`. */
export function formatDay(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const diff = daysBetween(date, now);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return `on ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)}`;
}

const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

/** `Today`, `Yesterday`, or a short date like `Nov 12`, for table "Updated" columns. */
export function formatUpdatedDay(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const diff = daysBetween(date, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return shortDateFormatter.format(date);
}
