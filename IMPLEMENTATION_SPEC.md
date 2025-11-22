# LightBikes Remediation & Modernization Specification

This specification outlines the plan to address critical security vulnerabilities, repair the broken testing infrastructure, and modernize the build system for the LightBikes project. It synthesizes recommendations from both Gemini and Amazon Q assessments.

## Phase 1: Security & Critical Fixes (Immediate)

**Goal:** Secure the application and restore confidence in the testing suite.

### 1.1. Credential Rotation (CRITICAL)
*   **Issue:** An API key was detected in `.env` and potentially committed to version control.
*   **Action:**
    *   **User Action Required:** Immediately revoke the exposed `GEMINI_API_KEY`.
    *   **User Action Required:** Generate a new key and store it securely (e.g., in a local `.env` file that is strictly ignored).
    *   **Code Change:** Verify `.env` is in `.gitignore` (It appears to be present, but we must ensure the file is removed from the git index if it was previously tracked).
    *   **Command:** `git rm --cached .env` (if tracked).

### 1.2. Fix Test Infrastructure
*   **Issue:** 96% of tests are failing due to incorrect module resolution (e.g., `Cannot find module './game.js'`).
*   **Action:**
    *   Create a `jest.config.js` to properly map module paths.
    *   Update test files to use correct relative paths or path aliases (e.g., `@/core/game.js`).
    *   **Target:** Achieve 100% pass rate on existing tests.

## Phase 2: Modern Build System (High Priority)

**Goal:** Replace the legacy `script.js` monolith and Browserify with a modern, performant build pipeline.

### 2.1. Migrate to Vite
*   **Issue:** The current build uses Browserify with no configuration, leading to unoptimized bundles.
*   **Action:**
    *   Install `vite`.
    *   Create `vite.config.js`.
    *   Update `package.json` scripts (`dev`, `build`, `preview`).
    *   Move `public/index.html` to the project root (standard Vite structure) or configure Vite to serve from `public`.

### 2.2. Refactor Entry Point
*   **Issue:** `script.js` is a 114KB monolith containing initialization, logic, and rendering code.
*   **Action:**
    *   Break `script.js` down. Move logic into `src/` modules:
        *   `src/main.js` (New entry point).
        *   `src/core/` (Game loop, state).
        *   `src/rendering/` (Three.js logic).
        *   `src/ui/` (DOM manipulation).
    *   Ensure the new entry point imports these modules properly.

## Phase 3: CI/CD & Quality (Medium Priority)

**Goal:** Automate quality checks to prevent regression.

### 3.1. GitHub Actions Pipeline
*   **Action:** Create `.github/workflows/ci.yml`.
*   **Steps:**
    *   Checkout code.
    *   Install dependencies (`npm ci`).
    *   Run Tests (`npm test`).
    *   Build Project (`npm run build`).

### 3.2. Linting & Formatting
*   **Action:**
    *   Install `eslint` and `prettier`.
    *   Configure rules to enforce code style and catch common errors.
    *   Add `npm run lint` script.

## Phase 4: Server Hardening (Follow-up)

**Goal:** Prepare the server for production deployment.

### 4.1. Security Middleware
*   **Action:**
    *   Install `helmet` (Security headers).
    *   Install `express-rate-limit` (Prevent abuse).
    *   Install `express-validator` (Input sanitization).
    *   Update `server/index.js` to use these middlewares.

---

## Implementation Plan

1.  **Execute Phase 1.1 & 1.2 immediately.** This unblocks all future work by ensuring tests pass.
2.  **Execute Phase 2.** This modernizes the dev experience.
3.  **Execute Phase 3.** This ensures long-term stability.
