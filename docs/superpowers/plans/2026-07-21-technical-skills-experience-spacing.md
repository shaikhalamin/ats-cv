# Technical Skills to Experience Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the established nine-point visual separation between Technical Skills and Experience when Technical Skills is rendered immediately after Professional Summary.

**Architecture:** Keep both section renderers and their page-break behavior unchanged. In the existing `placeTechnicalSkillsAfterSummary` branch, add six points to the vertical position returned by `renderTechnicalSkillsSection` before passing that position to `renderExperienceSection`; protect the branch-specific flow with a source-level regression assertion in the existing order test.

**Tech Stack:** TypeScript, PDFKit, Node.js built-in test runner, ESLint.

## Global Constraints

- The reordered branch adds exactly six points after Technical Skills and before Experience, increasing the established visible gap from three points to nine points.
- The default Professional Summary, Experience, Technical Skills, Education order and its spacing remain unchanged when the checkbox is disabled.
- Technical Skills content and internal row spacing remain unchanged.
- Experience content and internal spacing remain unchanged.
- Checkbox state, PDF request options, and API behavior remain unchanged.
- Existing section renderers and page-break behavior remain unchanged; the added six points participate in the same vertical-position flow passed to the Experience renderer.
- Add no dependencies and introduce no new exported interfaces.

---

## File Structure

- Modify: `tests/technical-skills-order-source.test.mjs:49-65`
  - Extend the existing PDF-generator order test with a regression assertion that requires the six-point adjustment to occur between the reordered Technical Skills and Experience calls.
- Modify: `lib/pdf/generator.ts:439-456`
  - Advance `yPosition` by six only in the `placeTechnicalSkillsAfterSummary` branch, after Technical Skills returns and before Experience receives the position.

## Implementation Tasks

### Task 1: Restore Reordered Technical Skills-to-Experience Spacing

**Files:**
- Modify: `tests/technical-skills-order-source.test.mjs:49-65`
- Modify: `lib/pdf/generator.ts:439-456`
- Test: `tests/technical-skills-order-source.test.mjs`

**Interfaces:**
- Consumes: `PDFGenerationOptions.placeTechnicalSkillsAfterSummary?: boolean`, `renderTechnicalSkillsSection(context: SectionRenderContext): number`, and `renderExperienceSection(context: SectionRenderContext): number`.
- Produces: When `placeTechnicalSkillsAfterSummary` is true, `renderExperienceSection` receives the Technical Skills return value plus six points; no exported signature or request option changes.

- [ ] **Step 1: Add the failing reordered-spacing assertion**

In `tests/technical-skills-order-source.test.mjs`, add this assertion inside `PDF generator exposes the render option and conditionally orders sections`, immediately after its existing conditional-order assertion:

```js
  assert.match(
    generatorSource,
    /if \(options\.placeTechnicalSkillsAfterSummary\) \{\s*yPosition = renderTechnicalSkillsSection\(\{[\s\S]*?\}\);\s*yPosition \+= 6;\s*yPosition = renderExperienceSection\(\{/,
  );
```

- [ ] **Step 2: Run the focused test and verify the new assertion fails**

Run:

```bash
node --test --test-name-pattern="PDF generator exposes the render option and conditionally orders sections" tests/technical-skills-order-source.test.mjs
```

Expected: FAIL with `AssertionError [ERR_ASSERTION]` because the reordered branch calls `renderExperienceSection` immediately after `renderTechnicalSkillsSection` and does not yet match `yPosition \+= 6;`.

- [ ] **Step 3: Add the six-point adjustment in the reordered branch**

In `lib/pdf/generator.ts`, replace the current `if (options.placeTechnicalSkillsAfterSummary)` branch with this block, leaving the existing `else` branch unchanged:

```ts
      if (options.placeTechnicalSkillsAfterSummary) {
        yPosition = renderTechnicalSkillsSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
        yPosition += 6;
        yPosition = renderExperienceSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
      } else {
```

This retains the three points returned after the final Technical Skills row and adds six before Experience, yielding the required nine-point separation without changing either renderer.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
node --test --test-name-pattern="PDF generator exposes the render option and conditionally orders sections" tests/technical-skills-order-source.test.mjs
```

Expected: PASS for `PDF generator exposes the render option and conditionally orders sections`; the other three tests in the file are skipped by the name filter.

- [ ] **Step 5: Run the complete automated verification**

Run all Node tests:

```bash
node --test tests/*.test.mjs
```

Expected: 15 tests pass with 0 failures.

Run lint:

```bash
npm run lint
```

Expected: exit code 0. The existing unused-variable warnings for `LINE_GAP` and `lightFont` in `scripts/pdfkit.cv.ts` may still be reported; this spacing change must not modify that unrelated script.

- [ ] **Step 6: Verify both PDF layouts visually**

Start the application:

```bash
npm run dev
```

Expected: Next.js reports the local application at `http://localhost:3000`.

At `http://localhost:3000`, leave **Include Project Showcase** unchecked and perform both checks:

1. Check **Technical Skills after Professional Summary**, click **Preview**, and inspect the generated PDF. Expected: the order is Professional Summary, Technical Skills, Experience, Education; the visible Technical Skills-to-Experience separation is larger than the former three-point gap and totals nine points from the existing three-point renderer return plus the new six-point branch adjustment.
2. Uncheck **Technical Skills after Professional Summary**, click **Preview**, and inspect the regenerated PDF. Expected: the order remains Professional Summary, Experience, Technical Skills, Education, with the default layout and spacing unchanged.

Stop the development server with `Ctrl-C` after both checks.

- [ ] **Step 7: Review the scoped diff and commit**

Run:

```bash
git diff --check
git diff -- tests/technical-skills-order-source.test.mjs lib/pdf/generator.ts
```

Expected: `git diff --check` produces no output. The scoped diff contains one regression assertion and one `yPosition += 6;` implementation line, with no renderer, option, checkbox, API, or default-order changes.

Commit:

```bash
git add tests/technical-skills-order-source.test.mjs lib/pdf/generator.ts
git commit -m "fix: preserve technical skills experience spacing"
```
