# Product Requirements Document (PRD)
## CodePush — Competitive Programming → GitHub Chrome Extension

**Status:** Draft v1
**Related docs:** `cp-to-github-extension-plan.md` (architecture), `rules.md` (dev guardrails), `phases2.md` (detailed roadmap)

---

## 1. Problem Statement

Competitive programmers and interview-prep learners solve dozens to hundreds of problems on platforms like LeetCode and Codeforces, but that work is siloed inside those platforms. Manually copying each accepted solution into a local Git repo, writing a commit message, and pushing it is tedious enough that most people simply don't do it — so their GitHub portfolio undersells their actual practice history, and they lose an easy way to track progress over time.

**CodePush** is a Chrome extension that detects an accepted submission, lets the user review it, and pushes it to a GitHub repository with consistent formatting and metadata — turning problem-solving practice into an always-up-to-date, presentable portfolio with minimal friction.

---

## 2. Goals

### 2.1 Product Goals
- Reduce the time to get a solved problem into GitHub from a multi-step manual copy/paste to a single confirmed click.
- Produce a GitHub repo history that looks intentional and professional (consistent structure, metadata, commit messages) without the user having to design that system themselves.
- Never take an irreversible or surprising action on the user's behalf — every push is explicitly confirmed.

### 2.2 Non-Goals (out of scope for v1)
- Judging, grading, or scoring solution quality.
- Refactoring, optimizing, or rewriting user code.
- Supporting every competitive programming platform on day one (see §5, Scope).
- Team/multi-user collaboration features (shared repos across multiple contributors' submissions).
- Mobile support (Chrome desktop extension only).

---

## 3. Target Users

| Persona | Description | Primary need |
|---|---|---|
| **Interview-prep grinder** | Working through LeetCode problem lists ahead of job interviews | Wants a visible, dated GitHub history as proof of consistent practice |
| **Competitive programmer** | Active on Codeforces, tracking contest performance | Wants an organized archive of solutions by contest/rating for later review |
| **CS student building a portfolio** | Early career, wants GitHub activity for recruiters | Wants minimal-effort, good-looking commit history without manual repo hygiene |

---

## 4. User Stories

1. *As a LeetCode user*, when I get an "Accepted" verdict, I want the extension to notice automatically so I don't have to remember to push anything myself.
2. *As a user*, I want to review the code, commit message, and target repo/branch before anything is pushed, so I stay in control of my GitHub history.
3. *As a user*, I want each pushed file to include the problem name, link, and difficulty as a header comment, so my repo is self-documenting without extra work.
4. *As a user*, I want a consistent commit message format across all my pushes, so my Git log reads cleanly.
5. *As a returning user*, if I re-solve a problem I've already pushed, I want the extension to recognize that and offer an "update" flow rather than silently duplicating or overwriting.
6. *As a security-conscious user*, I want to authenticate with GitHub via OAuth (not paste a raw token into a form I have to trust blindly), and I want a clear way to disconnect at any time.
7. *As a user on an unstable connection*, if a push fails partway, I want a clear error and a retry option — not a corrupted or partial commit.

---

## 5. Scope

### 5.1 v1 Supported Platforms
- LeetCode
- Codeforces

### 5.2 In Scope
- Detection of accepted/solved submissions on supported platforms.
- Code + metadata extraction (problem title, link, difficulty/rating, tags, language).
- GitHub OAuth authentication and repo/branch selection.
- Manual review + explicit confirmation before every push.
- Configurable file header and commit message templates.
- Optional, opt-in code formatting (whitespace/style only, no logic changes).
- Conflict handling (existing file at target path, non-fast-forward branch state).
- Manual-paste fallback if automatic detection/extraction fails.

### 5.3 Out of Scope (v1)
- Additional platforms (Codewars, AtCoder, HackerRank, etc.) — deferred to post-launch (Phase 7).
- Auto-generated README/progress-table maintenance — opt-in stretch feature, not core v1.
- Local Git / native-messaging-based commits — API-only for v1 (see architecture doc §3.3).
- Pull-request-based workflows (push-to-branch-then-PR) — configurable stretch goal, not required for v1 launch.

---

## 6. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Detect an accepted submission on LeetCode and Codeforces without requiring the user to manually trigger a scan | Must |
| FR-2 | Extract the full, unmodified solution code and its language | Must |
| FR-3 | Extract problem metadata: title, canonical URL, difficulty/rating, tags | Must |
| FR-4 | Show a popup preview (code, metadata, editable commit message, target repo/branch) before any push | Must |
| FR-5 | Require an explicit user action ("Push") before writing to GitHub — no auto-push | Must |
| FR-6 | Authenticate to GitHub via OAuth device flow; support a fine-grained PAT as a fallback | Must |
| FR-7 | Let the user select or create a target repository and branch | Must |
| FR-8 | Generate a file header comment from a configurable template using extracted metadata | Must |
| FR-9 | Generate a commit message from a configurable template | Must |
| FR-10 | Detect an existing file at the target path and prompt Overwrite / Rename / Cancel — never overwrite silently | Must |
| FR-11 | Detect non-fast-forward branch conflicts, retry safely, and surface a manual-resolution prompt if retries are exhausted | Must |
| FR-12 | Provide a manual-paste fallback path if detection or extraction fails | Should |
| FR-13 | Offer optional, opt-in code formatting (Prettier/clang-format-class tools), per language | Should |
| FR-14 | Let the user configure a folder-naming convention for pushed files | Should |
| FR-15 | Deduplicate repeated detection of the same accepted submission | Should |
| FR-16 | Maintain an optional auto-generated README progress table | Could |
| FR-17 | Support pushing to a feature branch + opening a PR instead of pushing directly | Could |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | No GitHub client secret in the extension bundle; tokens never stored in `localStorage`; minimum necessary OAuth scope requested; users can revoke access at any time |
| **Privacy** | No user code or metadata is sent anywhere other than GitHub's API and the user's own configured repo; no third-party analytics on submission content |
| **Reliability** | A failed or interrupted push must never leave the target repo in a partially-committed state (atomic commit via Git Data API) |
| **Performance** | Detection should surface a badge/notification within a few seconds of an accepted verdict; popup should render the pending preview without a noticeable delay |
| **Compatibility** | Chrome (Manifest V3), current stable channel; graceful degradation (manual mode) if a platform's DOM structure changes |
| **Accessibility** | Popup and options UI pass a basic automated accessibility audit (e.g., axe-core) |
| **Maintainability** | Platform-specific selectors isolated per adapter so a breaking site change requires touching one file, not core logic |

---

## 8. UX Requirements

- Empty, pending, pushing, success, and error states in the popup, each with a clear next action (see architecture doc §5.1).
- No push occurs without the user seeing a preview first — this is a hard UX requirement, not just a backend rule.
- Errors must be human-readable and actionable (e.g., "GitHub session expired — reconnect" rather than a raw HTTP status code).
- Options page must make it obvious how to disconnect GitHub and what data is stored locally.

---

## 9. Success Metrics

| Metric | Target (post-launch, first 90 days) |
|---|---|
| Time from "Accepted" verdict to successful push (for users who push) | Under 30 seconds of active user interaction |
| Push success rate (excluding user-cancelled) | ≥ 95% |
| Selector-breakage-caused failures | Detected and patched within 72 hours of a platform UI change (via Phase 7 selector-health check) |
| Weekly active pushers among installed-user base | Track as the core engagement signal; no fixed target pre-launch |
| Support/bug reports related to "unexpected overwrite" or "unwanted push" | Zero tolerance — treated as a P0 if it ever occurs |

---

## 10. Risks & Assumptions

| Risk / Assumption | Notes |
|---|---|
| LeetCode's frontend changes frequently | Assumed ongoing maintenance cost; mitigated by isolated selectors + health checks (see `phases2.md` Phase 7) |
| GitHub API rate limits (5,000 req/hr) | Assumed sufficient for individual users' push volume; revisit if usage patterns show otherwise |
| Users are comfortable granting repo-write OAuth scope | Assumed acceptable given the core value prop requires it; fine-grained PAT offered as a lower-trust alternative |
| Chrome Web Store review may push back on host permissions or OAuth flow | Mitigated by narrow permission scoping and a documented privacy policy (see `rules.md` §1, §9) |
| Users may want platforms beyond LeetCode/Codeforces immediately | Deferred by design; `PlatformExtractor` interface exists specifically to make this low-cost later |

---

## 11. Milestones

Maps to the phased roadmap in `phases2.md`:

- **M1 — Pipeline validated (Codeforces, no GitHub push):** end of Phase 1
- **M2 — First real push to GitHub works end-to-end:** end of Phase 2
- **M3 — Both v1 platforms supported:** end of Phase 3
- **M4 — Industrial-standards formatting/templating complete:** end of Phase 4
- **M5 — Error handling and fallback modes hardened:** end of Phase 5
- **M6 — Web Store submission ready:** end of Phase 6

---

## 12. Open Questions

- Should the free/default experience include a bundled formatter for every supported language, or start with JS/TS/Python only and expand?
- Do we want a lightweight account-free mode (extension usable without OAuth, PAT-only) as a permanent option, or just a temporary bridge for early adopters?
- Should the auto-generated README progress table (FR-16) be part of the v1 launch scope or strictly post-launch? Currently scoped as `Could` — revisit after early user feedback.