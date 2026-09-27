# 04 Gitflow & Commit Rules: fustation-tool

## 1. Branch Model

| Branch | Role |
|---|---|
| `main` | Stable line, tracks `origin/main`. Only squashed, verified commits land here. |
| `features/Design_{Story}` | Spec branch: requirements, design, tasks, diagrams, api-design, ui-design for one story. |
| `features/Implementation_{Story}` | Code branch for the same story: `src/` changes plus tests. Reviewed separately from its design sibling. |
| `dev` | Scratch integration branch. Holds temp commits; never merged as-is. |
| `backup-before-squash` | Safety pointer taken before a squash. Delete once the squash is verified on `main`. |

Hotfixes for logged issues may use `fix/ISSUE-{n}` off `main` when no spec change is involved.

## 2. Branch State Snapshot (2026-09-28)

- `main` = `origin/main` = `df6e95b` (feat: fix FE PDF export & guarding ID).
- `features/Design_SSOT_Scaffold` = `18dbfe7` (temp commit 1: batch progress footer, S3 refresh engine, 10-item ZIP partitions, image proxy) plus uncommitted ISSUE-84 dual-route work and this scaffold. Created from a detached HEAD so that work is no longer orphan-prone.
- `dev` = `180b108` (temp commit, marked not working), branched from `df6e95b`; superseded by `18dbfe7`.
- `backup-before-squash` = `365d536`, five temp commits off `6c66478`, already squashed into `c0db5c6`.

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

## 6. Temporary Commit Squashing & Precedence Protocol

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
