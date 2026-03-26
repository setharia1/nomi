import { safeDecodeURIComponent } from "@/lib/url/safeDecode";

const OPERATION_NAME_RE = /^[\w\-./]+$/;
export const MAX_OPERATION_NAME_LENGTH = 600;

/**
 * Parses a potentially URL-encoded operation name from a query param.
 * Returns null for malformed encodings or disallowed characters.
 */
export function parseOperationNameParam(raw: string | null): string | null {
  if (!raw) return null;
  const decoded = safeDecodeURIComponent(raw, "");
  const name = decoded.trim();
  if (!name || name.length > MAX_OPERATION_NAME_LENGTH) return null;
  if (!OPERATION_NAME_RE.test(name)) return null;
  return name;
}

export { safeDecodeURIComponent };
