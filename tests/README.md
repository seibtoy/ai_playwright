## Playwright Test Suite

### Directory Structure

```txt
tests/
├── config/                       # Shared test configuration
│   ├── global-setup.ts          # Pre-login and storageState generation
│   └── urls.ts                  # Centralized paths to storage files
├── data/                         # Test data files
│   └── test-pdf.pdf             # PDF used for upload tests
├── helpers/                      # Utility helpers and setup scripts
│   ├── auth.ts                  # Simple auth helper using OTP code from e‑mail
│   ├── generate-email.ts        # Test email generator
│   └── save-admin-session.spec.ts # Manual admin session bootstrap
├── pages/                        # Page Object Model
│   ├── chat-page.ts             # Main chat page (extends Sidebar)
│   ├── profile-page.ts          # Profile page
│   ├── sidebar-component.ts     # Shared sidebar, navigation, user menu
│   ├── signin-page.ts           # Sign-in page / Continue as guest
│   └── stratsync-dashboard-page.ts # StratSync dashboard page
├── regression/                   # Regression / performance scenarios
│   ├── analyze-final-response-time.spec.ts
│   └── response-aggregation.spec.ts
├── smoke/                        # Smoke tests for core functionality
│   ├── main-page/
│   │   ├── chat-ui.spec.ts      # Chat + attachments, message actions
│   │   └── sidebar.spec.ts      # Navigation, user menu, guest/auth flows
│   ├── profile-page/
│   │   └── profile.spec.ts      # Profile, delete-account modal
│   ├── signin-page/
│   │   └── signin.spec.ts       # Sign-in screen, Continue as guest, logout
│   └── stratsync-page/
│       └── stratsync.spec.ts    # StratSync dashboard navigation
└── storage/                      # Local storage files for auth
    ├── main-user.json           # storageState for main user
    └── test-user.json           # storageState for test user
    # additional runtime file (not committed):
    # - storage-state-admin.json  – admin session
```

### Getting Started

#### 1. Environment Variables

`playwright.config.ts` reads `.env` from the repository root. At minimum you need:

```bash
# Application URLs
BASE_URL=https://your-app-url.com
AI_LEADERSHIP_URL=https://connect.aileadership.com

# Users for OTP-based login
MAIN_USER_EMAIL=playwright-main-user@example.com
TEST_USER_EMAIL=playwright-test-user@example.com
AUTH_CODE=000000  # one-time code that is delivered to the inbox in staging
```

In CI these variables are provided via GitHub Actions:

- **`BASE_URL`** and **`AI_LEADERSHIP_URL`** — `Actions → Variables`
- **`MAIN_USER_EMAIL`**, **`TEST_USER_EMAIL`** — `Actions → Variables`
- **`AUTH_CODE`** — `Actions → Secrets`

#### 2. Dependencies

All test devDependencies are defined in `package.json` and installed with:

```bash
pnpm install
```

### Running Tests (local)

#### Full test run

```bash
# via npm script
pnpm test

# direct call
pnpm exec playwright test
```

#### Selected groups / files

```bash
# Smoke only
pnpm exec playwright test tests/smoke

# Regression only
pnpm exec playwright test tests/regression

# Specific test file
pnpm exec playwright test tests/smoke/signin-page/signin.spec.ts
```

#### Useful options

```bash
# UI mode
pnpm exec playwright test --ui

# Headed mode (visible browser)
pnpm exec playwright test --headed

# Run only in Chromium
pnpm exec playwright test --project=chromium

# Number of workers (parallelism)
pnpm exec playwright test --workers=6

# Debug mode
pnpm exec playwright test --debug
```

#### Reports

```bash
# HTML report
pnpm exec playwright test --reporter=html

# Open last report
pnpm exec playwright show-report
```

### 🔧 Test Configuration

Main config: `playwright.config.ts`

- `testDir: "./tests"`
- `testIgnore: ["regression/**", "helpers/save-admin-session.spec.ts"]`
- `tsconfig: "./tsconfig.tests.json"`
- `globalSetup: "./tests/config/global-setup.ts"`
- `use.baseURL: process.env.BASE_URL`
- projects: Chromium, Firefox, WebKit
- `retries: process.env.CI ? 2 : 0`
- `workers: process.env.CI ? 1 : undefined`

#### Global Setup

`tests/config/global-setup.ts`:

- ensures `tests/storage` directory exists;
- logs in **main** and **test** users via `Auth` (`tests/helpers/auth.ts`) using:
  - `BASE_URL`
  - `MAIN_USER_EMAIL`
  - `TEST_USER_EMAIL`
  - `AUTH_CODE`
- saves storage state to:
  - `tests/storage/main-user.json`
  - `tests/storage/test-user.json`

Most smoke tests reuse these files via constants from `tests/config/urls.ts`.

#### Authentication System

- **Primary path (CI and default runs)** — `Auth` (`tests/helpers/auth.ts`):
  - opens `/signin` on `BASE_URL`;
  - fills `MAIN_USER_EMAIL` or `TEST_USER_EMAIL`;
  - types the `AUTH_CODE` into all code inputs;
  - waits for redirect to `/`.
- **Additional MailSlurp-based helper** — `AuthHelper` in `tests/helpers/save-session.ts`:
  - creates/reuses MailSlurp inboxes;
  - reads the real 6‑digit code from e‑mail;
  - saves cookies to `tests/storage/main-user.json` / `tests/storage/test-user.json`;
  - caches inbox definitions in `tests/storage/inboxes.json`.

MailSlurp is handy locally, but **is not used in GitHub Actions by default**.

#### Parallel Execution

- locally: worker count is chosen by Playwright; tests run in three projects (Chromium, Firefox, WebKit);
- in CI: `workers: 1` and `retries: 2` for stability;
- you can override using `--workers=N` locally.

### 👨‍💼 Admin Setup (Manual)

The admin session is used in `tests/regression/analyze-final-response-time.spec.ts` and is created manually:

1. Run the session-setup script:

   ```bash
   pnpm exec playwright test tests/helpers/save-admin-session.spec.ts
   ```

2. In the opened browser:

   - complete the full admin login flow;
   - after `page.pause()` resume execution in Playwright UI.

3. The script saves cookies to `tests/storage/storage-state-admin.json`, which regression tests then reuse.

**Important**:

- do **not** commit `storage-state-admin.json` to the repo;
- when the session expires, rerun the script.

### Test Categories

#### Smoke Tests (`tests/smoke`)

Fast checks for critical flows:

- `signin-page/signin.spec.ts`
  - sign‑in screen UI and behavior;
  - e‑mail validation, toasts, verification-code form;
  - Terms of Service links;
  - `Continue as guest` and logout flows.
- `main-page/sidebar.spec.ts`
  - navigation via sidebar to core sections;
  - theme switching;
  - current user e‑mail display;
  - sidebar behavior for guest vs authenticated users.
- `main-page/chat-ui.spec.ts`
  - visibility and state of main chat UI elements;
  - file upload and preview;
  - upvote / downvote / copy buttons, clipboard checks;
  - chat privacy (private / public) and access by other users;
  - guest chat limits and “chat not found” modal.
- `profile-page/profile.spec.ts`
  - “My Account” block and user e‑mail;
  - “Danger Zone” and delete-account modal;
  - enabling delete only after typing `DELETE`.
- `stratsync-page/stratsync.spec.ts`
  - switching StratSync dashboard tabs (company / personal);
  - basic checks for dashboard creation controls.

#### Regression Tests (`tests/regression`)

Performance‑sensitive and heavy scenarios:

- `response-aggregation.spec.ts`
  - login as main user via `Auth`;
  - multiple long-message sends;
  - response-time measurement and aggregated logging.
- `analyze-final-response-time.spec.ts`
  - flows via admin UI and `Run the Business` section;
  - generating a set of responses with “Save as Final Response”;
  - working with Response Aggregation and measuring thinking/response time.

### Page Object Model

Tests are built around POM for readability and reuse:

- **`SigninPage`**
  - e‑mail and verification-code inputs;
  - “Send verification code”, “Resend code”, “Use a different email”;
  - `continueAsGuest` helper that navigates to the main page.
- **`Sidebar`**
  - “Take the Assessment”, “Run the Business”, “Response Aggregation” links;
  - user menu, theme toggle, logout;
  - chat controls (More menu, delete chat, etc.).
- **`ChatPage`** (extends `Sidebar`)
  - sending messages and interacting with `/api/chat`;
  - chat privacy (Private / Public);
  - attachments, preview, upvote/downvote/copy actions;
  - “Thinking…” locator and helper elements for timing analysis;
  - “Chat not found” modal.
- **`ProfilePage`**
  - delete-account modal and `DELETE` confirmation input.
- **`StratsyncDashboardPage`**
  - switching between “Company Dashboard” and “My StratSync”;
  - buttons for creating new dashboards.

### Helper Classes

- **`Auth` (`tests/helpers/auth.ts`)**
  - simple login helper using a known `AUTH_CODE`;
  - `loginAsMainUser` / `loginAsTestUser`, consumed by `global-setup` and regression tests.
- **`generateEmail()`**
  - unique e‑mail generator for UI-only login/modals;
  - used where full authentication is not required.

### Test Data Management

- **Storage files**
  - `tests/storage/main-user.json`, `tests/storage/test-user.json` — auth cookies created in `global-setup`.
  - `tests/storage/storage-state-admin.json` — admin session, created manually via `save-admin-session.spec.ts`.
- **Data files**
  - `tests/data/test-pdf.pdf` — sample file for upload scenarios.

### CI / GitHub Actions

Workflow `.github/workflows/playwright.yml`:

- triggers:
  - `repository_dispatch` from Vercel (`vercel.deployment.success`);
  - `workflow_dispatch` with inputs:
    - `deployment_url` — arbitrary URL to test against;
    - `run_full_suite` — `false` (smoke only) or `true` (full suite).
- steps:
  - install dependencies via `pnpm install`;
  - cache Playwright browsers;
  - compute `TEST_URL` (from `deployment_url` or `BASE_URL` variable);
  - run tests:
    - smoke: `pnpm exec playwright test tests/smoke --reporter=list,html --workers=2`;
    - full: `pnpm exec playwright test --reporter=list,html --workers=2`;
  - upload artifacts: HTML report (`playwright-report`) and traces (`test-results`).

Environment variables in the workflow match those described above (`BASE_URL`, `AI_LEADERSHIP_URL`, `MAIN_USER_EMAIL`, `TEST_USER_EMAIL`, `AUTH_CODE`).

### Troubleshooting

1. **Auth issues**
   - ensure `BASE_URL` points to a live environment;
   - verify `MAIN_USER_EMAIL`, `TEST_USER_EMAIL` and `AUTH_CODE` match that environment.
2. **Environment configuration errors**
   - ensure `.env` exists and all variables are set;
   - in CI, check `Settings → Secrets and variables → Actions`.
3. **Parallel execution problems**
   - if tests are flaky, try `--workers=1`;
   - make sure tests do not share mutable global state.
4. **Admin session**
   - if admin regression tests fail due to auth, recreate `storage-state-admin.json` using the Admin Setup section.

### Debug Mode

```bash
# Specific test in debug mode
pnpm exec playwright test tests/smoke/signin-page/signin.spec.ts --debug

# Headed browser with a single worker
pnpm exec playwright test --headed --workers=1
```

### Contributing & Best Practices

- **Structure**: place new tests into the existing hierarchy (smoke / regression, subfolders per page/area).
- **POM**: move selectors and interactions into Page Objects.
- **Independence**: tests should be idempotent and order‑independent.
- **Naming**: use descriptive `describe` / `test` names that reflect business value.
- **Assertions**: use `expect` with clear conditions and timeouts.
- **README**: update this file when adding major new test areas.
