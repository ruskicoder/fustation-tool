# Guidelines for Continuous Automatic Implementation & Autonomous AI Loop

## 1. Overview
This document specifies the strict execution rules and workflow for `fustation-tool` development when executing implementation phases autonomously under continuous AI agent loop execution.

---

## 2. Pre-Implementation Verification & Planning (Stage 1 & 2)
- **Mandatory Web Search**: During Stage 1 (Issue Detection) and Stage 2 (Implementation Plan Drafting), each AI response MUST execute a web search (`search_web`) every time before any response to ensure full technical context and align with current web standards.
- **Specification Alignment**: The AI is **mandatory** to double-check all specification documents (`requirements.md`, `design.md`, `tasks.md`, `development-rules.md`) and confirm alignment with the user before proceeding with execution.

---

## 3. Strict Continuous Execution Loop

When prompted by the user to proceed with continuous autonomous implementation, the AI SHALL execute ALL tasks continuously under the following strict step-by-step cycle:

```
Read Task Spec ──► Read Target Files (RBW) ──► Anti-Hallucination Thinking ──► Implementation
                                                                                      │
Iteration Complete ◄── Mark Task Done ◄── Self-Critique & Think ◄── Build & Test Verification
```

### Detailed Loop Step Specifications:

1. **Read Task Spec**: Inspect `.kiro/specs/fustation-tool/tasks.md` or `task.md` to identify the current active subtask.
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
9. **Mark Task Complete**: Update task status checkbox `- [x]` in `tasks.md` or `.kiro/specs/.../tasks.md`.
10. **Iterate Autonomously**: Proceed to the next task in sequence without stopping until the phase or requested scope is completed.

---

## 4. Anti-Oscillation & Loop Guard Rules
- **Tool Failure Limit**: If a build command, linter, or test script fails > 2 times with identical error output, HALT tool calls, output the un-truncated error log, and seek user intervention.
- **File Oscillation Guard**: If the same source file is edited > 2 times without resolving the target issue, STOP editing, revert to the last working state, summarize what was attempted, and ask for guidance.
