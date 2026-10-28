# Next.js Security Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the known security advisories affecting this project's Next.js 16.1.6 dependency path.

**Architecture:** Keep the application on the supported Next.js 16 line and upgrade the framework plus its ESLint configuration to the current stable 16.2.12 release. Because Next.js 16.2.12 still declares vulnerable PostCSS and Sharp versions, resolve PostCSS 8.5.25 across the build dependency graph and scope Sharp 0.35.3 to `next`; the project-wide PostCSS override also replaces the vulnerable version accepted by Tailwind's PostCSS plugin.

**Tech Stack:** Next.js 16, React 19, npm lockfile v3, Node.js test runner, ESLint, TypeScript

## Global Constraints

- Keep `next` and `eslint-config-next` pinned to the same exact version.
- Use the current stable Next.js release, `16.2.12`; do not install preview or canary builds.
- Resolve PostCSS at `8.5.25` across the build dependency graph and scope the Sharp override to dependencies of `next`.
- Do not modify application behavior or unrelated direct dependencies.

---

### Task 1: Upgrade and constrain the Next.js dependency path

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm's `next@16.2.12`, `eslint-config-next@16.2.12`, `postcss@8.5.25`, and `sharp@0.35.3` packages.
- Produces: A reproducible dependency graph in which Next.js and its relevant transitive packages fall outside the known vulnerable ranges.

- [x] **Step 1: Verify the security check fails before the fix**

Run: `npm audit --json`

Expected: non-zero exit with direct `next@16.1.6` advisories and vulnerable `next > postcss@8.4.31` and `next > sharp@0.34.5` paths.

- [x] **Step 2: Upgrade the matched Next.js packages**

Run: `npm install --save-exact next@16.2.12 eslint-config-next@16.2.12`

Expected: `package.json` and `package-lock.json` resolve both packages at `16.2.12`.

- [x] **Step 3: Add narrow transitive dependency overrides**

Add this top-level block to `package.json`:

```json
"overrides": {
  "postcss": "8.5.25",
  "next": {
    "sharp": "0.35.3"
  }
}
```

Then run: `npm install`

Expected: the lockfile and installed dependency tree resolve every PostCSS path at `8.5.25` and `next > sharp@0.35.3`.

- [x] **Step 4: Verify the remediated dependency graph**

Run: `npm ls next eslint-config-next postcss sharp --all`

Expected: Next.js packages resolve at `16.2.12`; Next.js's PostCSS and Sharp packages resolve at `8.5.25` and `0.35.3`, respectively.

- [x] **Step 5: Verify Next.js-related audit findings are gone**

Run: `npm audit --json | jq '.vulnerabilities | with_entries(select(.key == "next" or .key == "postcss" or .key == "sharp"))'`

Expected: `{}`. Any remaining audit entries must be unrelated to the Next.js dependency path and reported separately.

### Task 2: Run application regression checks

**Files:**
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: The dependency graph produced by Task 1 and the existing application source.
- Produces: Evidence that the security-only dependency update preserves source regressions, lint rules, and the production build.

- [x] **Step 1: Run source regression tests**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass with zero failures.

- [x] **Step 2: Run lint**

Run: `npm run lint`

Expected: ESLint exits successfully with no errors.

- [x] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js 16.2.12 completes the optimized production build successfully.

- [x] **Step 4: Review the final patch**

Run: `git diff --check && git diff -- package.json package-lock.json docs/superpowers/plans/2026-08-02-nextjs-security-update.md`

Expected: no whitespace errors and no application-source changes.
