# Development Phases Roadmap

## 🎯 Vision
Build a **productivity Chrome extension** that helps users manage tasks, track time, and stay focused — all from their browser toolbar.

---

## Phase 1: Foundation ✅
> **Goal:** Set up project scaffold and core infrastructure

### Tasks
- [x] Initialize project with Vite + React + TypeScript
- [x] Configure Manifest V3 with required permissions
- [x] Set up popup UI shell (empty but functional)
- [x] Set up background service worker
- [x] Set up content script placeholder
- [x] Configure Tailwind CSS
- [x] Configure ESLint + Prettier
- [x] Create shared types and constants
- [x] Create Chrome Storage utility wrapper
- [x] Build & verify extension loads in Chrome

### Deliverables
- Working extension that loads in `chrome://extensions`
- Popup renders a "Hello World" page
- Background script logs on install
- Clean build with zero errors

---

## Phase 2: Task Management ✅
> **Goal:** Core task CRUD functionality

### Tasks
- [x] Design task data model (id, title, description, priority, status, createdAt)
- [x] Build task creation form in popup
- [x] Build task list view with filtering
- [x] Implement task CRUD operations via Chrome Storage
- [x] Add task completion toggle
- [x] Add task priority levels (Low, Medium, High)
- [x] Add task deletion with confirmation
- [x] Persist tasks across browser sessions

### Deliverables
- Users can create, read, update, and delete tasks
- Tasks persist in Chrome Storage
- Clean, responsive popup UI

---

## Phase 3: Categories & Organization ✅
> **Goal:** Help users organize tasks into groups

### Tasks
- [x] Add category/project model
- [x] Category creation and management UI
- [x] Assign tasks to categories
- [x] Filter tasks by category
- [x] Color-coded categories
- [x] Drag-and-drop task reordering

### Deliverables
- Users can create categories and organize tasks
- Visual hierarchy between categories and tasks

---

## Phase 4: Focus Mode ✅
> **Goal:** Help users stay focused on current work

### Tasks
- [x] Focus timer (Pomodoro-style)
- [x] Current task highlighting
- [x] Website blocker during focus sessions
- [x] Focus statistics tracking
- [x] Break reminders
- [x] Sound notifications

### Deliverables
- Built-in focus timer in popup
- Optional website blocking during focus
- Daily/weekly focus statistics

---

## Phase 5: Quick Capture ✅
> **Goal:** Capture ideas without leaving the current page

### Tasks
- [x] Right-click context menu integration
- [x] Quick note capture from any page
- [x] Page bookmarking with notes
- [x] Screenshot annotation (optional)
- [x] Sync captured items to task list

### Deliverables
- Right-click menu options for quick capture
- Captured items appear in task list
- Page context (URL, title) saved with captures

---

## Phase 6: Data & Analytics ✅
> **Goal:** Insights into productivity patterns

### Tasks
- [x] Task completion rate tracking
- [x] Time spent per category
- [x] Weekly/monthly productivity dashboard
- [x] Export data (JSON/CSV)
- [x] Import existing data

### Deliverables
- Built-in analytics dashboard
- Data export/import functionality

---

## 📅 Timeline Estimate
| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1 | 1-2 days | 🔴 Critical |
| Phase 2 | 3-5 days | 🔴 Critical |
| Phase 3 | 2-3 days | 🟡 High |
| Phase 4 | 3-4 days | 🟡 High |
| Phase 5 | 2-3 days | 🟢 Medium |
| Phase 6 | 2-3 days | 🟢 Medium |

**Total estimated time:** 2-3 weeks
