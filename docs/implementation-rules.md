# Guidelines for Continuous Automatic Implementation

## 1. Overview
This document specifies the strict execution rules and workflow for `fustation-tool` development when executing implementation phases autonomously.

---

## 2. Pre-Implementation Verification & Planning (Stage 1 & 2)
- **Mandatory Web Search**: During Stage 1 (Issue Detection) and Stage 2 (Implementation Plan Drafting), each AI response MUST execute a web search (`search_web`) every time before any response to ensure full technical context and align with current web standards.
- Tasks are divided into large implementation phases.
- The AI is **mandatory** to double check all specification documents (`requirements.md`, `design.md`, `tasks.md`) and confirm alignment with the user before proceeding with execution.

---

## 3. Strict Execution Loop
When prompted by the user to proceed with continuous autonomous implementation, the AI SHALL execute ALL tasks continuously under the following strict step-by-step cycle:

```
Read Tasks ──► Read Files ──► Thinking Stage ──► Implementation ──► Syntax Check
                                                                         │
Iteration Complete ◄── Mark Complete ◄── Think ◄── Check Task ◄── Test Check & Logic
```

### Detailed Loop Steps:
1. **Read Tasks**: Inspect `.kiro/specs/fustation-tool/tasks.md` to identify the current active subtask.
2. **Read Files**: Read all target files and context before writing or modifying code.
3. **Thinking Stage**: Analyze requirements, edge cases, imports, dependencies, and blast radius.
4. **Implementation**: Perform minimal, precise, production-grade code modifications or file creations.
5. **Syntax Check**: Run terminal commands (e.g. `node -c`, linter, build check) to ensure no syntax errors.
6. **Test Check**: Run tests, linters, or structural checks to verify runtime correctness.
7. **Double Check Business Logic**: Verify implementation against EARS acceptance criteria in `requirements.md`.
8. **Double Check Task**: Confirm all criteria specified in `tasks.md` for this subtask are fully satisfied.
9. **Think**: Reflect on the completed work and verify integration with preceding components.
10. **Mark Complete**: Update task status checkbox `- [x]` in `tasks.md`.
11. **Iterate**: Move to the next task in sequence without stopping until the phase or requested scope is completed.
