<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **fustation-tool** (636 symbols, 1428 relationships, 51 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/fustation-tool/context` | Codebase overview, check index freshness |
| `gitnexus://repo/fustation-tool/clusters` | All functional areas |
| `gitnexus://repo/fustation-tool/processes` | All execution flows |
| `gitnexus://repo/fustation-tool/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
# Documentation-Driven Engineering & Spec-First SSOT

Convention source: `dev-flow/11-doc_driven_scaffold_and_ssot_conventions.md`. Index: `docs/README.md`.

1. Spec before code: no production code, manifest change, or UI view without an approved suite in `specs/{module}/{stack}/` (`requirements.md` in EARS, `design.md`, `tasks.md`). This project's suite is `specs/fustation-tool/fullstack/`. Bug fixes from `docs/log-issues.md` may skip new spec files but must update the owning requirement and task.
2. Clarification gate: when requirements or boundaries are ambiguous, ask 3 to 5 questions and stop until answered.
3. Living ledger: update `docs/current-progress.md` at each milestone with completed tasks, test counts, and the resumption point.
4. Conventions: `docs/00` to `05` are binding; diagrams are Mermaid `.mmd` in `docs/diagrams/` and `docs/flows/`.
5. Asset hygiene: runtime code stays in tracked `src/`; `dist/` is a build projection; never commit cookies, tokens, or presigned URLs.
6. Branches: `features/Design_{Story}` for specs, `features/Implementation_{Story}` for code (see `docs/04-gitflow-and-commit-rules.md`).
