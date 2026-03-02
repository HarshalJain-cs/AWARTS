/**
 * Input sanitization utilities for AWARTS.
 */

// ─── Strip HTML Tags ───────────────────────────────────────────────────
const HTML_TAG_RE = /<[^>]*>/g;
const MULTI_SPACE_RE = /\s{2,}/g;

/**
 * Remove any HTML tags from input text and collapse whitespace.
 */
export function stripHtml(input: string): string {
  return input.replace(HTML_TAG_RE, '').replace(MULTI_SPACE_RE, ' ').trim();
}

// ─── Username Validation ───────────────────────────────────────────────
const USERNAME_RE = /^[a-zA-Z0-9_-]{1,39}$/;

/**
 * Validate that a username matches the allowed pattern.
 * GitHub-style: alphanumeric, hyphens, underscores, 1-39 chars.
 */
export function validateUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

/**
 * Sanitize a search query to prevent SQL injection via ilike.
 * Escapes special Postgres LIKE characters.
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .trim()
    .slice(0, 100);
}

// ─── Image URL Validation ──────────────────────────────────────────────
export const ALLOWED_IMAGE_ORIGINS = [
  'https://avatars.githubusercontent.com',
  'https://lh3.googleusercontent.com',
  // Supabase storage — origin will be the project URL
];

/**
 * Check if an image URL is from an allowed origin or the project's
 * Supabase storage bucket.
 */
export function isAllowedImageUrl(url: string, supabaseUrl: string): boolean {
  try {
    const parsed = new URL(url);
    const supabaseOrigin = new URL(supabaseUrl).origin;
    return (
      ALLOWED_IMAGE_ORIGINS.some((o) => parsed.origin === o) ||
      parsed.origin === supabaseOrigin
    );
  } catch {
    return false;
  }
}

// ─── Magic Byte Validation ─────────────────────────────────────────────
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
};

/**
 * Validate the first bytes of a file against known image magic bytes.
 * Returns the detected MIME type or null.
 */
export function detectImageType(bytes: Uint8Array): string | null {
  for (const [mime, patterns] of Object.entries(MAGIC_BYTES)) {
    for (const pattern of patterns) {
      if (pattern.every((b, i) => bytes[i] === b)) {
        return mime;
      }
    }
  }
  return null;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * Get file extension for a detected MIME type.
 */
export function mimeToExtension(mime: string): string | null {
  return MIME_TO_EXT[mime] ?? null;
}
