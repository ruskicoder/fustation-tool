# 01 Architecture Conventions: fustation-tool

## 1. Runtime Layers

The extension has no server of its own. All logic runs in the browser, inside two Manifest V3 contexts built by Vite from `src/` into `dist/`.

| Layer | Files | Owns | Must not |
|---|---|---|---|
| Manifest | `src/manifest.json` (the only manifest shipped; copied to `dist/` by `vite.config.ts`) | permissions, host matches, entry files | omit any Chrome API the code uses |
| Service worker | `src/background.ts` -> `dist/background.js` | SPA history observer forwarding `FUSTATION_URL_CHANGED` to the tab | touch the DOM or React |
| Content entry | `src/content.tsx` -> `dist/content.js` | mounting `#fustation-tool-root`, keep-alive `MutationObserver` | contain business logic |
| UI (React 18) | `src/components/*.tsx`, `src/hooks/*.ts`, `src/styles/overlay.css` | presentation, panel geometry, toasts, orchestration of pipeline calls from `Overlay.tsx` | parse RSC payloads or build export files inline |
| Data pipeline | `src/utils/parser.ts`, `batchFetcher.ts`, `images.ts`, `math.ts`, `compiler.ts`, `exporter.ts`, `highlight.ts`, `panelCollision.ts` | extraction, normalization, asset fetch, compile, download | import React components |
| Persistence | `src/utils/storage.ts` | every `chrome.storage.local` key (`STORAGE_KEYS`) and dataset normalization | be bypassed; components never call `chrome.storage` directly |
| Types | `src/types/index.ts` | the single `ExamDataset` / `SavedExamItem` / batch state schema | be duplicated in other files |

Dependency direction: `components -> utils -> types`. `utils` never imports from `components`. Details of the pipeline and the platform endpoints it consumes are in `02-backend-conventions.md`; the visual map is `diagrams/system-architecture.mmd`.

## 2. Structural Rules

- One owner per invariant. Exam-id and route recognition lives only in `src/utils/examId.ts` (CUID-shaped ids).
- Every storage key is declared in `STORAGE_KEYS` in `storage.ts`.
- Build output is a projection: never hand-edit `dist/`. Rebuild with `npm run build`, which also runs `scripts/build.js` verification and the fixture test suite.
- Test fixtures come from `docs/webfetches/**` captures; the tracked suite is `tests/test-flow.ts` (`npm test`). `scratch/` is gitignored and for throwaway probes only.

## 3. Clean Code Conventions


### Rule 3.1: Single Responsibility & Modular Scoping
- **Function Boundary Limit**: Functions and React components MUST remain focused, modular, and single-purpose (target < 30-40 lines per function where feasible).
- **Decoupled Business Logic**: Separate data parsing (`parser.ts`), chrome storage transactions (`storage.ts`), document export formatting (`exporter.ts` / `compiler.ts`), and React UI state presentation (`SavedTab.tsx`, `Overlay.tsx`).

### Rule 3.2: Strict Type Safety & Zero `any` Allowance
- **100% Strict Typing**: Implicit and explicit `any` types are strictly prohibited (`no-implicit-any`).
- **Defensive Type Guards**: Use narrow TS discriminator unions (`examCategory: 'FE' | 'PE'`) and strict interfaces. All optional properties MUST be checked for non-null/undefined before property dereferencing.

### Rule 3.3: Immutable & Defensive State Mutations
- **No In-Place Array/Object Mutation**: Avoid mutating state objects or arrays directly (`list.push()`, `delete list[key]`). Always construct new shallow copy references (`{ ...prev }`, `prev.filter(...)`) to ensure React state identity triggers proper re-renders.
- **No DOM Property Pollution**: Never mutate private third-party DOM properties or override global browser runtime prototypes.

### Rule 3.4: Fault Boundaries & Exception Discipline
- **Explicit Error Handling**: Every async network request, Chrome storage call, and HTML/RSC parsing operation MUST be wrapped in explicit `try/catch` blocks.
- **No Swallowed Exceptions**: Empty catch blocks (`catch (e) {}`) without logged warnings or user toast notifications are strictly forbidden unless explicitly documented as a silent optional feature check.
- **User Notification Sync**: All runtime errors and failure states MUST surface user-visible feedback via the transient toast notification system (`push('Error message', 'error')`).

---
