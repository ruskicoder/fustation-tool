# Manual Testing Guide: Overlay UI

## Setup

1. `npm run build`.
2. `chrome://extensions`, enable Developer mode, Load unpacked, select `dist/`. After each rebuild press Reload on the card and refresh the fustation.net tab.
3. Log in to `https://www.fustation.net`.

## Checklist

| # | Scenario | Expected | Req |
|---|---|---|---|
| 1 | Open an FE exam via `/marketplace/exam/{cuid}` | Overlay extracts, metadata filled, status `Saved / Ready` | 1.1, 1.3, 2.1 |
| 2 | Open the same exam via `/marketplace/{cuid}` | Same result | 1.1 |
| 3 | Navigate `/home` -> exam in-app (no reload) | Extraction runs after SPA navigation | 1.6 |
| 4 | Export MD, PDF, JSON | Files open; math rendered; images embedded | 4.1, 4.3, 6.1-6.3 |
| 5 | PE exam: export PDF, ZIP, ALL | Paper and answer key download; viewer shows PDF | 3.1-3.4, 6.4 |
| 6 | Saved tab: search, inspect `[i]`, delete, Clear all | Scoped actions, red danger button | 5.4 |
| 7 | Catalog page: batch with preview 3, pause, resume, stop | Preview list, state survives extension reload | 7.1-7.3 |
| 8 | Bulk export 12+ items | Two ZIP volumes with `manifest.md`, footer shows progress | 7.4, 7.5 |
| 9 | Drag, resize, theme cycle, reload page | Geometry, tab, theme restored | 8.1 |
| 10 | Keyboard only: Tab through, arrows on switcher | Visible focus rings, arrow keys change format | 8.3 |

Record failures in `docs/log-issues.md` with the scenario number.
