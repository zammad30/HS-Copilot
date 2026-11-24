import { routes } from "@/shared/config";

const MAX_LENGTH = 200;

// Auth screens would bounce a signed-in user straight back, and /_kit is dev only.
const EXCLUDED = new Set<string>([routes.signIn, routes.signUp, routes.resetPassword, routes.kit]);

const STATIC_PATHS = new Set<string>();
for (const value of Object.values(routes)) {
  if (typeof value === "string" && !EXCLUDED.has(value)) STATIC_PATHS.add(value);
}

// The two dynamic routes, matched with one safe segment so an id cannot smuggle in a slash.
const DYNAMIC_PATTERNS = [
  /^\/app\/classifications\/[A-Za-z0-9_-]+$/,
  /^\/app\/batches\/[A-Za-z0-9_-]+$/,
];

// Whitespace, control characters (code points below 32 and DEL) and backslashes
// anywhere in the raw value. A char-code scan avoids a control-character regex.
function hasUnsafeChar(value: string): boolean {
  if (/[\s\\]/.test(value)) return true;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

/**
 * Returns `value` as an in-app path to navigate to after sign-in or sign-up, or
 * `routes.home` for anything that is not provably one. Only a known app route is
 * accepted (auth screens and `/_kit` are not), so an open redirect, a script
 * scheme or a path-lookalike cannot get through. Query and hash parts are dropped
 * on purpose: the destination is a page, never carried state. Non-strings (a
 * repeated query param arrives as an array) fall back too.
 */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_LENGTH) {
    return routes.home;
  }
  // Checked on the raw value so " /app", "/app\n" and tabs never pass.
  if (hasUnsafeChar(value)) return routes.home;
  if (!value.startsWith("/") || value.startsWith("//")) return routes.home;

  const path = value.split(/[?#]/, 1)[0];
  if (STATIC_PATHS.has(path) || DYNAMIC_PATTERNS.some((pattern) => pattern.test(path))) {
    return path;
  }
  return routes.home;
}
