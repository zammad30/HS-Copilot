export interface ExpiringSessionText {
  save: (text: string, maxLength: number, now?: number) => void;
  /** Returns the saved text, or undefined. Does not clear a valid value, so a
   * caller can read it twice (React StrictMode) and clear it once it is used. */
  read: (maxLength: number, now?: number) => string | undefined;
  clear: () => void;
}

function storage(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

/**
 * A short piece of text kept in sessionStorage under `key` for `ttlMs`. Every
 * storage call is guarded: it can throw (privacy modes, quota) or be empty, and
 * none of that may break the page. The text never goes in a URL or router state.
 */
export function createExpiringSessionText(key: string, ttlMs: number): ExpiringSessionText {
  function clear() {
    try {
      storage()?.removeItem(key);
    } catch {
      // An unreadable store is treated as empty; there is nothing to recover.
    }
  }

  function save(text: string, maxLength: number, now: number = Date.now()) {
    const capped = text.trim().slice(0, maxLength);
    if (!capped) {
      clear();
      return;
    }
    try {
      storage()?.setItem(key, JSON.stringify({ text: capped, savedAt: now }));
    } catch {
      // Losing the draft is acceptable; the visitor can retype it.
    }
  }

  function read(maxLength: number, now: number = Date.now()): string | undefined {
    let raw: string | null | undefined;
    try {
      raw = storage()?.getItem(key);
    } catch {
      return undefined;
    }
    if (raw === null || raw === undefined) return undefined;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      clear();
      return undefined;
    }

    const record = parsed as { text?: unknown; savedAt?: unknown } | null;
    if (
      typeof record !== "object" ||
      record === null ||
      typeof record.text !== "string" ||
      typeof record.savedAt !== "number" ||
      !Number.isFinite(record.savedAt) ||
      record.savedAt > now ||
      now - record.savedAt > ttlMs
    ) {
      clear();
      return undefined;
    }

    const text = record.text.trim().slice(0, maxLength);
    if (!text) {
      clear();
      return undefined;
    }
    return text;
  }

  return { save, read, clear };
}
