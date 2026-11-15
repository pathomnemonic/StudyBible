/** Only ordinary web links are external links; javascript:, data:, file: and malformed URLs are never rendered as hrefs. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !!parsed.hostname;
  } catch {
    return false;
  }
}

/** HashRouter destinations stay inside this application, never protocol-relative or backslash paths. */
export function isAppHashRoute(value: unknown): value is string {
  return typeof value === 'string' &&
    value.startsWith('#/') &&
    !value.startsWith('#//') &&
    !value.includes('\\') &&
    !/[\u0000-\u001f\u007f]/.test(value);
}
