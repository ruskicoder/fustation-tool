/**
 * highlight.ts
 * Wraps keyword matches in <mark class="fus-highlight">…</mark>.
 * HTML-entity-escapes the source text BEFORE inserting marks to prevent XSS
 * from arbitrary exam content rendered via dangerouslySetInnerHTML.
 */

/** Escape special HTML characters in a plain string. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Escape special regex characters so a user query is treated as a literal string. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Returns an HTML string with all case-insensitive occurrences of `query`
 * wrapped in `<mark class="fus-highlight">…</mark>`.
 * Returns the HTML-escaped plain text when `query` is empty or blank.
 */
export function highlightText(text: string, query: string): string {
  const safe = escapeHtml(text);
  const trimmed = query.trim();
  if (!trimmed) return safe;

  const pattern = new RegExp(`(${escapeRegex(trimmed)})`, 'gi');
  return safe.replace(pattern, '<mark class="fus-highlight">$1</mark>');
}

/**
 * Returns true when the plain-text `haystack` contains `needle`
 * (case-insensitive). Used for computing match sets without DOM.
 */
export function containsQuery(haystack: string, needle: string): boolean {
  if (!needle.trim()) return false;
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}
