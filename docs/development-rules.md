# Development & Commit Protocol: fustation-tool

## 1. Commit & Push Flow

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

## 2. Commit Message Standards

Commits MUST follow Conventional Commits standard formatting:
- `feat: ...` for new features or user capabilities.
- `fix: ...` for bug fixes or hotfixes.
- `docs: ...` for documentation updates.
- `refactor: ...` for architectural or codebase refactoring.
- `style: ...` for UI layout, styling, and asset adjustments.
- `test: ...` for test suite or integration test additions.

---

## 3. Unsolicited Actions Policy

- **No Unsolicited Commits**: The AI assistant MUST NEVER execute `git commit` or `git push` without an explicit directive from the user.
- **No Unsolicited Pushes**: All remote pushes require explicit user authorization.

---

## 4. End-to-End Development & Implementation Governance Workflow

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

### Stage 4: Implementation & Self-Critique Execution Cycle
During active implementation, the AI MUST follow this strict inner execution cycle:
1. **Read & Context**: Read target files in full to obtain complete context before editing.
2. **Execute Edits**: Perform minimal, precise, production-grade code modifications.
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

## 5. Temporary Commit Squashing & Precedence Protocol

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


