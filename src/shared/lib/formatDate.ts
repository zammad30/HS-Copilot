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

const fullDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** `Nov 23, 2026`, always with the year, for printed records (the other
 * helpers say "today" or drop the year, which does not survive on paper). */
export function formatFullDate(iso: string): string {
  return fullDateFormatter.format(new Date(iso));
}

const fullDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** `Nov 23, 2026, 8:22 PM`, date with year plus time, never "today" or time-only. */
export function formatFullDateTime(iso: string): string {
  return fullDateTimeFormatter.format(new Date(iso));
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

/**
 * `2 hours ago`, `today at 9:14 AM`, `yesterday at 9:14 AM`, or `on Nov 12`,
 * for a "Started {relative time}" style description. Pairs with a leading
 * "Started " (or similar) at the call site, so this returns the suffix only.
 */
const RELATIVE_HOURS_THRESHOLD = 6;

export function formatRelativeStart(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const minutesAgo = Math.round((now.getTime() - date.getTime()) / (60 * 1000));

  if (minutesAgo < 1) return "just now";
  if (minutesAgo < 60) return `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`;

  const hoursAgo = Math.round(minutesAgo / 60);
  const diff = daysBetween(date, now);
  if (diff === 0 && hoursAgo < RELATIVE_HOURS_THRESHOLD) {
    return `${hoursAgo} hour${hoursAgo === 1 ? "" : "s"} ago`;
  }
  if (diff === 0) return `today at ${timeFormatter.format(date)}`;
  if (diff === 1) return `yesterday at ${timeFormatter.format(date)}`;
  return `on ${shortDateFormatter.format(date)}`;
}
