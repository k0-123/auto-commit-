# Project Rules & Conventions

## 🧩 Project Overview
A **Chrome Extension** built with **React + TypeScript** — a productivity tool to help users stay focused and organized.

---

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| UI Framework | React 18+ |
| Language | TypeScript (strict mode) |
| Build Tool | Vite + CRXJS (or Webpack with CRX) |
| Styling | Tailwind CSS |
| State Management | Zustand (lightweight) |
| Storage | Chrome Storage API (`chrome.storage.local`) |
| Testing | Vitest + React Testing Library |
| Linting | ESLint + Prettier |

---

## 📁 Project Structure
```
extension/
├── public/
│   ├── icons/              # Extension icons (16, 48, 128px)
│   └── manifest.json       # Chrome Manifest V3
├── src/
│   ├── popup/              # Popup UI (React)
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── components/
│   ├── background/         # Service Worker
│   │   └── index.ts
│   ├── content/            # Content Scripts
│   │   └── index.ts
│   ├── options/            # Options Page (React)
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── shared/             # Shared utilities & types
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── storage.ts
│   └── styles/
│       └── global.css
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## 📏 Coding Conventions

### TypeScript
- Use **strict mode** — no `any` types allowed
- Prefer `interface` over `type` for object shapes
- Use `readonly` for immutable data
- Export types from `shared/types.ts`

### React
- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components small and focused (< 150 lines)
- Co-locate related components in feature folders

### Naming
| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `task-item.tsx` |
| Components | PascalCase | `TaskItem` |
| Functions | camelCase | `getActiveTasks` |
| Constants | UPPER_SNAKE_CASE | `MAX_TASKS_LIMIT` |
| Types/Interfaces | PascalCase | `TaskInterface` |

### Styling
- Use **Tailwind CSS** utility classes
- Avoid inline styles unless dynamic
- Use CSS modules for complex component styles

---

## 🔐 Security Rules
- Never store API keys in source code
- Use `chrome.storage` for sensitive data, never `localStorage`
- Validate all external data before rendering
- Use CSP-compliant code (no `eval()`, no inline scripts)
- Follow Manifest V3 permission model (least privilege)

---

## 🧪 Testing Rules
- Write unit tests for all utility functions
- Write component tests for complex UI logic
- Target **80%+ code coverage** for business logic
- Mock Chrome APIs in tests

---

## 🚀 Git Workflow
- Branch naming: `feature/`, `fix/`, `chore/`
- Commit messages: Conventional Commits format
  - `feat: add task creation UI`
  - `fix: resolve popup rendering bug`
  - `chore: update dependencies`
- All changes require review before merge

---

## ⚠️ Anti-Patterns to Avoid
- ❌ No `var` — use `const` or `let`
- ❌ No nested callbacks — use async/await
- ❌ No magic numbers — extract to constants
- ❌ No direct DOM manipulation in React components
- ❌ No oversized components — split into smaller pieces
