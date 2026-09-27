# fustation-tool Documentation (SSOT)

Target website: `fustation.net`. The extension fetches whole exam question banks (and PE paper and answer-key assets) and exports them offline as Markdown, PDF, JSON, or ZIP, because the site only exposes one question at a time.

Documentation is the single source of truth. Code follows specs, never the reverse. Convention source: `dev-flow/11-doc_driven_scaffold_and_ssot_conventions.md`.

| Path | Role |
|---|---|
| `00-system-context.md` | Purpose, glossary, platform entities, exam-code format, RSC payload rules |
| `01-architecture-conventions.md` | Runtime layers, dependency direction, structural and clean-code rules |
| `02-backend-conventions.md` | Data pipeline, consumed platform endpoints, error taxonomy |
| `03-frontend-conventions.md` | Overlay UI rules (sections 9 and 10 binding) and imported design-system guidance |
| `04-gitflow-and-commit-rules.md` | Branch model, current branch snapshot, commit, push and squash rules |
| `05-operational-workflows.md` | Spec-first lifecycle, governance stages, autonomous implementation loop |
| `current-progress.md` | Living ledger: milestones, test counts, resumption point |
| `log-issues.md` | Issue register: open issues and the resolved log |
| `diagrams/`, `flows/` | Mermaid `.mmd` architecture, data model, and flows |
| `webfetches/` | Captured site HTML used as test fixtures |
| `research/`, `ui/` | Research notes and the imported UI prototype |
| `../specs/fustation-tool/fullstack/` | `requirements.md` (EARS), `design.md`, `tasks.md`, `api-design/`, `ui-design/` |
| `../scripts/README.md` | Local tooling |

`envs/` from the convention is not created: the extension has no environment variables or secrets. Add it only when one appears.
