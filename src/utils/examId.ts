/**
 * Single owner of exam-route recognition. The platform serves an exam at both
 * `/marketplace/exam/{cuid}` and `/marketplace/{cuid}`; only CUID-shaped ids
 * (`c` + lowercase alphanumerics) count, so pages like `/marketplace/sell` or
 * Next.js `layout-*` chunks are never mistaken for exams.
 */
const EXAM_PATH_SOURCE = '/marketplace/(?:exam/)?(c[a-z0-9]{20,30})(?=[/?#"\'\\\\\\s]|$)';

export function extractExamIdFromPath(path: string): string | null {
  const m = path.match(new RegExp(EXAM_PATH_SOURCE));
  return m ? m[1] : null;
}

/** All distinct exam ids linked anywhere in an HTML or RSC payload, in document order. */
export function extractExamIdsFromHtml(html: string): string[] {
  const ids = new Set<string>();
  for (const m of html.matchAll(new RegExp(EXAM_PATH_SOURCE, 'g'))) ids.add(m[1]);
  return [...ids];
}
