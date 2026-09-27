# 05 Operational Workflows: fustation-tool

Normal development, issue triage, implementation, and autonomous-loop SOPs. Architecture and clean-code rules live in `01-architecture-conventions.md`; git and commit rules live in `04-gitflow-and-commit-rules.md`.

## 0. Spec-First SSOT Lifecycle

Order of operations for any new feature or behavior change:

Clarification Gate (3 to 5 questions, hard stop) -> `specs/{module}/{stack}/requirements.md` (EARS) -> `design.md` -> `tasks.md` -> implementation -> `docs/current-progress.md` ledger entry.

- Bug fixes logged in `docs/log-issues.md` may skip new spec files, but any change to required behavior MUST be reflected back into the owning `requirements.md` and `tasks.md`.
- `docs/current-progress.md` is updated at every milestone: completed tasks, test counts, and the exact resumption point.

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

## 2. End-to-End Governance Workflow

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
1. Update task checkboxes to completed in `specs/{module}/{stack}/tasks.md`.
2. Record completed implementations and new changes in `docs/current-progress.md`.
3. **DELETE the implemented/resolved issues from `docs/log-issues.md`**.
4. Report to the user with a comprehensive report containing:
   - Summary of changes made.
   - Exact implementation thinking flow (resolutions, vulnerabilities identified, self-fixes applied).
   - Confirmation of implementation completion.
5. **Standby** for further user directives.

---

## 3. Autonomous Implementation Loop

### 3.1 Pre-Implementation Verification & Planning (Stage 1 & 2)
- **Mandatory Web Search**: During Stage 1 (Issue Detection) and Stage 2 (Implementation Plan Drafting), each AI response MUST execute a web search (`search_web`) every time before any response to ensure full technical context and align with current web standards.
- **Specification Alignment**: The AI is **mandatory** to double-check all specification documents (`requirements.md`, `design.md`, `tasks.md`, `docs/05-operational-workflows.md`) and confirm alignment with the user before proceeding with execution.

---

### 3.2 Strict Continuous Execution Loop

When prompted by the user to proceed with continuous autonomous implementation, the AI SHALL execute ALL tasks continuously under the following strict step-by-step cycle:

```
Read Task Spec ──► Read Target Files (RBW) ──► Anti-Hallucination Thinking ──► Implementation
                                                                                      │
Iteration Complete ◄── Mark Task Done ◄── Self-Critique & Think ◄── Build & Test Verification
```

#### Detailed Loop Step Specifications:

1. **Read Task Spec**: Inspect `specs/fustation-tool/fullstack/tasks.md` to identify the current active subtask.
2. **Read Target Files (Mandatory RBW Principle)**: Read all target files and their imported dependencies completely using `view_file` before writing or modifying code. Never modify unread files or guess symbol definitions.
3. **Anti-Hallucination Thinking Stage**:
   - Verify all variable names, types, CSS selectors, and API endpoints against actual source code files.
   - Flag any unverified assumptions. If an assumption cannot be verified from codebase context, halt and inform the user.
   - Assess blast radius, imports, exports, and regression risks.
4. **Clean Code Implementation**:
   - Perform minimal, precise, production-grade code modifications or file creations.
   - Adhere strictly to Single Responsibility Principle, 100% strict TypeScript types, and defensive state update patterns.
5. **Syntax & Compilation Check**: Run build commands (`npm run build` or `tsc`) to ensure zero syntax or compilation errors.
6. **Runtime & Test Verification**: Run automated integration test scripts to verify runtime correctness and regression safety.
7. **Double-Check Business Logic**: Verify implementation against user requirements and EARS acceptance criteria in specification docs.
8. **Post-Test Self-Critique**: Evaluate 3 potential weak points/vulnerabilities/deviations. Undo any faulty implementation before re-applying a corrected fix.
9. **Mark Task Complete**: Update task status checkbox `- [x]` in `specs/{module}/{stack}/tasks.md`.
10. **Iterate Autonomously**: Proceed to the next task in sequence without stopping until the phase or requested scope is completed.

---

### 3.3 Anti-Oscillation & Loop Guard Rules
- **Tool Failure Limit**: If a build command, linter, or test script fails > 2 times with identical error output, HALT tool calls, output the un-truncated error log, and seek user intervention.
- **File Oscillation Guard**: If the same source file is edited > 2 times without resolving the target issue, STOP editing, revert to the last working state, summarize what was attempted, and ask for guidance.
