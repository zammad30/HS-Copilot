import { safeReturnPath } from "@/shared/lib/safeReturnPath";

/** The validated `next` query param. A repeated param (`?next=a&next=b`) is
 * treated as invalid on purpose, since either value could be attacker-chosen. */
export function returnPathFrom(searchParams: URLSearchParams): string {
  const values = searchParams.getAll("next");
  return safeReturnPath(values.length === 1 ? values[0] : values);
}

/** A link target that keeps the return path when the visitor switches between sign-in and sign-up. */
export function withReturnPath(pathname: string, searchParams: URLSearchParams) {
  if (!searchParams.has("next")) return pathname;
  return { pathname, search: `?next=${encodeURIComponent(returnPathFrom(searchParams))}` };
}
