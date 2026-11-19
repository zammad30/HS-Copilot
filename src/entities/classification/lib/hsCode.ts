const HS_CODE_PATTERN = /^\d{4}\.\d{2}(\.\d{2,4})?$/;

export function isValidHsCode(code: string): boolean {
  return HS_CODE_PATTERN.test(code.trim());
}
