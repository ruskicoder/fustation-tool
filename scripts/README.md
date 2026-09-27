# scripts/

Local tooling kept out of the extension bundle. Run from the repository root.

| Script | Run | Purpose |
|---|---|---|
| `build.js` | invoked by `npm run build` after `tsc && vite build` | Verifies `dist/manifest.json`, `dist/content.js`, `dist/background.js`, `dist/assets/content.css`, then runs the fixture suite `tests/test-flow.ts` via `tsx`. Exits 1 on any failure. |
| `verify-math-images.js` | `npx tsx scripts/verify-math-images.js` | Checks KaTeX sanitization (`&` handling), image URL normalization, Markdown compile, and print HTML for math and images. |
| `analyze_pe.js` | `node scripts/analyze_pe.js` | Ad-hoc probe for PE asset URL cleaning and `extractPeFromDOM` against saved PE page captures. |

Notes:

- Fixture inputs live in `docs/webfetches/{home,homepage,subject,examview}/`. Refresh them by saving the page HTML while logged in; never commit session cookies or tokens.
- `analyze_pe.js` embeds an expired presigned S3 URL as sample input. Replace it with a placeholder when next edited.
