# Development, Governance & Anti-Hallucination Protocol: fustation-tool

## 1. Core Operating Principles & Anti-Hallucination Engine

### Rule 1.1: Mandatory Read-Before-Write (RBW) Principle
- **Zero Unread Edits**: The AI assistant SHALL NEVER create, replace, or modify any source code file, stylesheet, or configuration file without first viewing and reading the target file AND its imported dependencies in full during the active session.
- **Full Symbol Context**: The AI MUST inspect complete symbol definitions, interfaces, and imported data structures before consuming or altering them. Partial snippet views (e.g. first 15 lines) are strictly insufficient for code modification.

### Rule 1.2: Zero Memory Speculation & Empirical Verification
- **No Training Memory Assumptions**: The AI assistant SHALL NOT infer function signatures, prop names, DOM selectors, CSS variable names, or S3/API endpoint URL formats from internal training memory or design documents.
- **Empirical Tool-First Search**: Every symbol name, API route, DOM element ID, and type definition MUST be empirically verified via `view_file` or `grep_search` prior to writing implementation code.
- **No Chain-Guessing**: If an initial assumption about code behavior or schema is unverified, the AI MUST HALT immediately. It is strictly forbidden to build secondary features or fallback logic on top of unverified assumptions.

### Rule 1.3: Explicit "I Don't Know / Need Verification" Standard
- **Honesty Over Fabrication**: If a technical requirement, API schema, or runtime behavior cannot be verified using available codebase files or search tools, the AI MUST state: *"I cannot verify [X] from the current codebase context"* and ask the user for clarification.
- **No Dummy Fallbacks**: The AI SHALL NOT write synthetic empty fallbacks, swallow errors silently, or return dummy mock objects (`return {}`, `return []`) to hide unverified API behavior.

### Rule 1.4: Anti-Oscillation & Loop Guard
- **Command Loop Limit**: If a build command, test script, or terminal operation is executed > 2 times with identical failure results, the AI MUST HALT tool execution immediately, analyze the root cause log, and report findings to the user.
- **File-Edit Oscillation Limit**: If the same file is edited > 2 times without resolving the target compilation error or bug, the AI MUST stop editing, perform a diff comparison of all attempted modifications, and seek user direction.

---

## 2. Clean Code & Architecture Conventions

### Rule 2.1: Single Responsibility & Modular Scoping
- **Function Boundary Limit**: Functions and React components MUST remain focused, modular, and single-purpose (target < 30-40 lines per function where feasible).
- **Decoupled Business Logic**: Separate data parsing (`parser.ts`), chrome storage transactions (`storage.ts`), document export formatting (`exporter.ts` / `compiler.ts`), and React UI state presentation (`SavedTab.tsx`, `Overlay.tsx`).

### Rule 2.2: Strict Type Safety & Zero `any` Allowance
- **100% Strict Typing**: Implicit and explicit `any` types are strictly prohibited (`no-implicit-any`).
- **Defensive Type Guards**: Use narrow TS discriminator unions (`examCategory: 'FE' | 'PE'`) and strict interfaces. All optional properties MUST be checked for non-null/undefined before property dereferencing.

### Rule 2.3: Immutable & Defensive State Mutations
- **No In-Place Array/Object Mutation**: Avoid mutating state objects or arrays directly (`list.push()`, `delete list[key]`). Always construct new shallow copy references (`{ ...prev }`, `prev.filter(...)`) to ensure React state identity triggers proper re-renders.
- **No DOM Property Pollution**: Never mutate private third-party DOM properties or override global browser runtime prototypes.

### Rule 2.4: Fault Boundaries & Exception Discipline
- **Explicit Error Handling**: Every async network request, Chrome storage call, and HTML/RSC parsing operation MUST be wrapped in explicit `try/catch` blocks.
- **No Swallowed Exceptions**: Empty catch blocks (`catch (e) {}`) without logged warnings or user toast notifications are strictly forbidden unless explicitly documented as a silent optional feature check.
- **User Notification Sync**: All runtime errors and failure states MUST surface user-visible feedback via the transient toast notification system (`push('Error message', 'error')`).

---

## 3. Commit & Push Flow

The AI assistant SHALL NOT commit or push code automatically unless explicitly requested by the user. When the user explicitly requests to commit or push code, the following strict sequence MUST be followed:

```
[ Explicit User Request ] 
          │
          ▼
  1. Check Origin (`git remote -v`, `git status`)
          │
          ▼
  2. Fetch Origin (`git fetch origin`)
          │
          ▼
  3. Pull with Rebase (`git pull --rebase origin <branch>`)
          │
          ▼
  4. Resolve Conflicts (if any)
          │
          ▼
  5. Stage & Commit (`git add . && git commit -m "type: description"`)
          │
          ▼
  6. Push Origin (`git push origin <branch>`)
```

---

## 4. Commit Message Standards

Commits MUST follow Conventional Commits standard formatting:
- `feat: ...` for new features or user capabilities.
- `fix: ...` for bug fixes or hotfixes.
- `docs: ...` for documentation updates.
- `refactor: ...` for architectural or codebase refactoring.
- `style: ...` for UI layout, styling, and asset adjustments.
- `test: ...` for test suite or integration test additions.

---

## 5. Unsolicited Actions Policy

- **No Unsolicited Commits**: The AI assistant MUST NEVER execute `git commit` or `git push` without an explicit directive from the user.
- **No Unsolicited Pushes**: All remote pushes require explicit user authorization.

---

## 6. End-to-End Governance Workflow

The AI assistant MUST follow this exact multi-stage workflow for all issue detection, plan drafting, implementation, self-critique, and documentation cleanup tasks:

### Stage 1: Issue Detection & Logging Phase
- When requested to scan/detect issues, the AI SHALL perform codebase/fetch scans, detect ALL issues, and record them exhaustively in `docs/log-issues.md`.
- **Mandatory Web Search**: For Stage 1 & Stage 2, each AI response MUST execute `search_web` every time before any response, to ensure complete context and alignment with the latest web standards.
- **Separation of Concerns**: Adding issues to `docs/log-issues.md` DOES NOT automatically trigger an implementation plan draft until the user explicitly requests it.

### Stage 2: Implementation Plan Drafting Phase
- **Mandatory Web Search**: For Stage 1 & Stage 2, each AI response MUST execute `search_web` every time before any response, to ensure complete context and alignment with the latest web standards.
- When the user specifies which issues to resolve, the AI SHALL draft an `implementation_plan.md` artifact targeting **ONLY those specified issues**.
- The plan MUST explicitly restate:
  1. Exactly which issues are being resolved.
  2. Suggested technical fixes for each issue.
  3. Internal reflection on any parts requiring user review.
  4. A set of clarifying questions to confirm design/layout choices with the user.

### Stage 3: Mandatory Explicit User Approval Gate
- The AI SHALL NOT execute code modifications, component refactorings, or file creations based on assumptions.
- Implementation MUST ONLY begin after receiving explicit approval from the user (*"I approve implementation plan"* or *"Proceed implementation"*).

### Stage 4: Continuous Implementation & Self-Critique Execution Cycle
During active implementation, the AI MUST follow this strict inner execution cycle:
1. **Read & Context**: Read target files in full to obtain complete context before editing (RBW Principle).
2. **Execute Edits**: Perform minimal, precise, production-grade code modifications adhering to Clean Code standards.
3. **Automated Verification**: Run build/test commands (e.g. `npm run build`) to verify zero syntax or compilation errors.
4. **Mandatory Post-Test Self-Critique**: After tests pass, the AI MUST internally reflect and evaluate at least **3 weak points / vulnerabilities / scope creep / wrong implementations**:
   - **Major Deviation / Plan Failure**: If an issue is severe enough that it deviates from the original implementation plan, **STOP immediately**, notify the user, and present next steps.
   - **Minor Issue / AI Fault**: If an issue is minor and largely the AI's fault (no scope creep), the AI MUST **UNDO the faulty implementation first**, then apply the corrected reimplementation.
5. **Re-Verification**: Re-run all automated tests and checks until clean pass is confirmed.

### Stage 5: Completion, Cleanup, & Reporting Phase
Upon successful implementation and verification:
1. Update task checkboxes to completed in `task.md`.
2. Record completed implementations and new changes in `docs/current-progress.md`.
3. **DELETE the implemented/resolved issues from `docs/log-issues.md`**.
4. Report to the user with a comprehensive report containing:
   - Summary of changes made.
   - Exact implementation thinking flow (resolutions, vulnerabilities identified, self-fixes applied).
   - Confirmation of implementation completion.
5. **Standby** for further user directives.

---

## 7. Temporary Commit Squashing & Precedence Protocol

When temporary or broken intermediate commits exist in local history (e.g., `(temp-notworking)`, `(temp-working-somewhat)`):

1. **Local Log Inspection**: Check `git log -n <N>` before committing to identify temporary or incomplete commits.
2. **Precedence Guarantee**: The latest working code in the current turn MUST ALWAYS override and supersede any temporary or broken implementations in earlier commits.
3. **Soft Reset & Squash Sequence**:
   - Stage and commit working changes on top of the working tree:
     `git add . && git commit -m "type: description"`
   - Reset soft to the last stable/permanent commit preceding the temporary commits:
     `git reset --soft <stable-commit-hash>`
   - Re-commit the combined index into a single clean commit:
     `git commit -m "type: description (resolving ISSUE-X, ISSUE-Y)"`
4. **Clean Tree Verification**: Confirm `git status` is clean and `git log` reflects a single squashed commit containing the latest working state.
