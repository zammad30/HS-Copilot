let override: number | null = null;

/** The mock layer's current time, in epoch ms. Lets fixtures and expiry
 * calculations be set to a known instant in tests without fake timers. */
export function mockNow(): number {
  return override ?? Date.now();
}

export function setMockNow(date: number | string | Date): void {
  override = new Date(date).getTime();
}

export function resetMockNow(): void {
  override = null;
}
