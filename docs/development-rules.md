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
