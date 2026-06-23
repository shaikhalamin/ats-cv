# Technical Skills Order Setting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a render-only checkbox that lets the generated PDF render Technical Skills immediately after Professional Summary without changing the CV JSON.

**Architecture:** Store the checkbox value as UI-only state in `CvContext`, include it in the PDF generation request payload, parse both wrapped and legacy raw request bodies in the API route, and pass an options object into the PDF generator. Refactor the existing generator section bodies into module-local helpers so the final section order is selected in one small conditional while preserving the current layout constants and y-position flow.

**Tech Stack:** Next.js App Router, React context, TypeScript, PDFKit, Zod, Node built-in test runner with source-level assertions.

---

## File Structure

- Create: `tests/technical-skills-order-source.test.mjs`
  - Adds focused source-level tests matching the current `tests/*.test.mjs` style.
  - Covers `CvContext`, `app/page.tsx`, `app/api/generate-pdf/route.ts`, and `lib/pdf/generator.ts`.
- Modify: `lib/context/CvContext.tsx:12-33,191-272,298-320`
  - Adds `placeTechnicalSkillsAfterSummary` and `setPlaceTechnicalSkillsAfterSummary`.
  - Clears `pdfUrl` and `pdfError` when the setting changes.
  - Sends `{ cvData, options }` to `/api/generate-pdf`.
- Modify: `app/page.tsx:11-82`
  - Destructures the context setting and setter.
  - Renders a checkbox beside the existing top controls.
- Modify: `lib/pdf/generator.ts:5,155-156,420-536,546-563`
  - Exports `PDFGenerationOptions`.
  - Changes `generatePDFBuffer` to accept an optional options object.
  - Extracts Experience, Technical Skills, and Education rendering into module-local helpers.
  - Selects section order with `placeTechnicalSkillsAfterSummary`.
- Modify: `app/api/generate-pdf/route.ts:1-51`
  - Parses wrapped and raw request bodies.
  - Validates only the CV data shape with `CVDataSchema`.
  - Passes normalized options into `generatePDFBuffer`.

## Implementation Tasks

### Task 1: Context State And Wrapped Payload

**Files:**
- Create: `tests/technical-skills-order-source.test.mjs`
- Modify: `lib/context/CvContext.tsx:12-33,191-272,298-320`
- Test: `tests/technical-skills-order-source.test.mjs`

- [ ] **Step 1: Write the failing context source test**

Create `tests/technical-skills-order-source.test.mjs` with this content:

```js
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const contextSource = await readFile(new URL('../lib/context/CvContext.tsx', import.meta.url), 'utf8');

test('CvContext exposes render-order setting and sends wrapped PDF payload', () => {
  assert.match(contextSource, /placeTechnicalSkillsAfterSummary:\s*boolean;/);
  assert.match(contextSource, /setPlaceTechnicalSkillsAfterSummary:\s*\(value: boolean\) => void;/);
  assert.match(
    contextSource,
    /const \[placeTechnicalSkillsAfterSummary,\s*setPlaceTechnicalSkillsAfterSummaryState\]\s*=\s*useState\(false\);/,
  );
  assert.match(
    contextSource,
    /const setPlaceTechnicalSkillsAfterSummary = useCallback\(\(value: boolean\) => \{[\s\S]*setPlaceTechnicalSkillsAfterSummaryState\(value\);[\s\S]*setPdfObjectUrl\(null\);[\s\S]*setPdfError\(null\);[\s\S]*\}, \[setPdfObjectUrl\]\);/,
  );
  assert.match(
    contextSource,
    /body:\s*JSON\.stringify\(\{\s*cvData,\s*options:\s*\{\s*placeTechnicalSkillsAfterSummary,\s*\},\s*\}\),/,
  );
  assert.match(
    contextSource,
    /\}, \[cvData, placeTechnicalSkillsAfterSummary, setPdfObjectUrl\]\);/,
  );
  assert.match(
    contextSource,
    /value=\{\{[\s\S]*placeTechnicalSkillsAfterSummary,[\s\S]*setPlaceTechnicalSkillsAfterSummary,[\s\S]*generatePdf,/,
  );
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
node --test tests/technical-skills-order-source.test.mjs
```

Expected: FAIL with an assertion showing `placeTechnicalSkillsAfterSummary` is not present in `lib/context/CvContext.tsx`.

- [ ] **Step 3: Add UI-only setting state to the context type and provider**

In `lib/context/CvContext.tsx`, add the setting fields after the PDF state fields in `CvContextType`:

```ts
  // Render settings
  placeTechnicalSkillsAfterSummary: boolean;
  setPlaceTechnicalSkillsAfterSummary: (value: boolean) => void;
```

Add this state after `const [pdfError, setPdfError] = useState<string | null>(null);`:

```ts
  // Render settings
  const [placeTechnicalSkillsAfterSummary, setPlaceTechnicalSkillsAfterSummaryState] = useState(false);
```

Add this callback after `setPdfObjectUrl`:

```ts
  const setPlaceTechnicalSkillsAfterSummary = useCallback((value: boolean) => {
    setPlaceTechnicalSkillsAfterSummaryState(value);
    setPdfObjectUrl(null);
    setPdfError(null);
  }, [setPdfObjectUrl]);
```

Change the fetch body inside `generatePdf` from:

```ts
        body: JSON.stringify(cvData),
```

to:

```ts
        body: JSON.stringify({
          cvData,
          options: {
            placeTechnicalSkillsAfterSummary,
          },
        }),
```

Change the `generatePdf` dependency list from:

```ts
  }, [cvData, setPdfObjectUrl]);
```

to:

```ts
  }, [cvData, placeTechnicalSkillsAfterSummary, setPdfObjectUrl]);
```

In `resetToDefault`, add the state reset before `setPdfObjectUrl(null);`:

```ts
    setPlaceTechnicalSkillsAfterSummaryState(false);
```

Add the context values before `generatePdf`:

```ts
        placeTechnicalSkillsAfterSummary,
        setPlaceTechnicalSkillsAfterSummary,
```

- [ ] **Step 4: Run the context source test to verify it passes**

Run:

```bash
node --test tests/technical-skills-order-source.test.mjs
```

Expected: PASS for `CvContext exposes render-order setting and sends wrapped PDF payload`.

- [ ] **Step 5: Commit the context change**

```bash
git add lib/context/CvContext.tsx tests/technical-skills-order-source.test.mjs
git commit -m "feat: add PDF render order context setting"
```

### Task 2: Header Checkbox Bound To Context

**Files:**
- Modify: `tests/technical-skills-order-source.test.mjs`
- Modify: `app/page.tsx:11-82`
- Test: `tests/technical-skills-order-source.test.mjs`

- [ ] **Step 1: Extend the source test for the page checkbox**

In `tests/technical-skills-order-source.test.mjs`, add this source read after the existing `contextSource` line:

```js
const pageSource = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
```

Add this test after the context test:

```js
test('app page renders a checkbox bound to the render-order setting', () => {
  assert.match(
    pageSource,
    /const \{[\s\S]*placeTechnicalSkillsAfterSummary,[\s\S]*setPlaceTechnicalSkillsAfterSummary,[\s\S]*\} = useCv\(\);/,
  );
  assert.match(pageSource, /type="checkbox"/);
  assert.match(pageSource, /checked=\{placeTechnicalSkillsAfterSummary\}/);
  assert.match(
    pageSource,
    /onChange=\{\(event\) => setPlaceTechnicalSkillsAfterSummary\(event\.target\.checked\)\}/,
  );
  assert.match(pageSource, /Technical Skills after Professional Summary/);
});
```

- [ ] **Step 2: Run the new page test to verify it fails**

Run:

```bash
node --test tests/technical-skills-order-source.test.mjs
```

Expected: FAIL for `app page renders a checkbox bound to the render-order setting` because `app/page.tsx` does not render the checkbox.

- [ ] **Step 3: Destructure the setting and render the checkbox**

In `app/page.tsx`, replace:

```tsx
  const { isValid, isGenerating, generatePdf, resetToDefault, validationErrors } = useCv();
```

with:

```tsx
  const {
    isValid,
    isGenerating,
    generatePdf,
    resetToDefault,
    validationErrors,
    placeTechnicalSkillsAfterSummary,
    setPlaceTechnicalSkillsAfterSummary,
  } = useCv();
```

Inside the header controls `<div className="flex items-center gap-3">`, add this label before the Preview button:

```tsx
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={placeTechnicalSkillsAfterSummary}
              onChange={(event) => setPlaceTechnicalSkillsAfterSummary(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Technical Skills after Professional Summary
          </label>
```

- [ ] **Step 4: Run the source test to verify it passes**

Run:

```bash
node --test tests/technical-skills-order-source.test.mjs
```

Expected: PASS for both tests in `tests/technical-skills-order-source.test.mjs`.

- [ ] **Step 5: Commit the checkbox change**

```bash
git add app/page.tsx tests/technical-skills-order-source.test.mjs
git commit -m "feat: add technical skills order checkbox"
```

### Task 3: Generator Options And Conditional Section Order

**Files:**
- Modify: `tests/technical-skills-order-source.test.mjs`
- Modify: `lib/pdf/generator.ts:5,155-156,420-536,546-563`
- Test: `tests/technical-skills-order-source.test.mjs`

- [ ] **Step 1: Extend the source test for generator options**

In `tests/technical-skills-order-source.test.mjs`, add this source read after the `pageSource` line:

```js
const generatorSource = await readFile(new URL('../lib/pdf/generator.ts', import.meta.url), 'utf8');
```

Add this test after the page test:

```js
test('PDF generator exposes the render option and conditionally orders sections', () => {
  assert.match(
    generatorSource,
    /export interface PDFGenerationOptions \{[\s\S]*placeTechnicalSkillsAfterSummary\?: boolean;[\s\S]*\}/,
  );
  assert.match(
    generatorSource,
    /export async function generatePDFBuffer\(\s*data: CVData,\s*options: PDFGenerationOptions = \{\},\s*\): Promise<Buffer>/,
  );
  assert.match(generatorSource, /function renderExperienceSection\(/);
  assert.match(generatorSource, /function renderTechnicalSkillsSection\(/);
  assert.match(generatorSource, /function renderEducationSection\(/);
  assert.match(
    generatorSource,
    /if \(options\.placeTechnicalSkillsAfterSummary\) \{[\s\S]*renderTechnicalSkillsSection\([\s\S]*renderExperienceSection\([\s\S]*\} else \{[\s\S]*renderExperienceSection\([\s\S]*renderTechnicalSkillsSection\([\s\S]*\}[\s\S]*renderEducationSection\(/,
  );
});
```

- [ ] **Step 2: Run the generator test to verify it fails**

Run:

```bash
node --test tests/technical-skills-order-source.test.mjs
```

Expected: FAIL for `PDF generator exposes the render option and conditionally orders sections` because `generatePDFBuffer` accepts only raw `CVData` and the section render bodies are inline.

- [ ] **Step 3: Add the generator options type and function signature**

In `lib/pdf/generator.ts`, add this after the `CVData` import:

```ts
export interface PDFGenerationOptions {
  placeTechnicalSkillsAfterSummary?: boolean;
}

type CheckPageBreak = (requiredSpace: number, yPosition: number) => number;

interface SectionRenderContext {
  doc: PDFKit.PDFDocument;
  data: CVData;
  yPosition: number;
  checkPageBreak: CheckPageBreak;
  boldFont: string;
  regularFont: string;
}
```

Change the generator signature from:

```ts
export async function generatePDFBuffer(data: CVData): Promise<Buffer> {
```

to:

```ts
export async function generatePDFBuffer(
  data: CVData,
  options: PDFGenerationOptions = {},
): Promise<Buffer> {
```

Change the local page-break helper from:

```ts
      const checkPageBreak = (requiredSpace: number): boolean => {
        if (doc.y + requiredSpace > doc.page.height - PAGE_MARGIN) {
          doc.addPage();
          yPosition = PAGE_MARGIN;
          return true;
        }
        return false;
      };
```

to:

```ts
      const checkPageBreak: CheckPageBreak = (requiredSpace, currentYPosition) => {
        if (doc.y + requiredSpace > doc.page.height - PAGE_MARGIN) {
          doc.addPage();
          return PAGE_MARGIN;
        }

        return currentYPosition;
      };
```

- [ ] **Step 4: Replace inline Experience, Technical Skills, and Education rendering with conditional helper calls**

In `lib/pdf/generator.ts`, replace the block from `// ========== EXPERIENCE ==========` through the end of the Education loop with this:

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
        yPosition = renderExperienceSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
      } else {
        yPosition = renderExperienceSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
        yPosition = renderTechnicalSkillsSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
      }

      yPosition = renderEducationSection({
        doc,
        data,
        yPosition,
        checkPageBreak,
        boldFont,
        regularFont,
      });
```

Add these helper functions above `addSectionTitle`:

```ts
function renderExperienceSection({
  doc,
  data,
  yPosition,
  checkPageBreak,
  boldFont,
  regularFont,
}: SectionRenderContext): number {
  // ========== EXPERIENCE ==========
  addSectionTitle(doc, 'EXPERIENCE', yPosition, boldFont);
  yPosition = doc.y + 8;

  for (const exp of data.experience) {
    yPosition = checkPageBreak(80, yPosition);

    doc.font(boldFont)
      .fontSize(COMPANY_FONT_SIZE)
      .fillColor(BLACK)
      .text(exp.company, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH - 140, lineBreak: false });

    doc.font(regularFont)
      .fontSize(CONTACT_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(exp.period, doc.page.width - PAGE_MARGIN - 140, yPosition, { width: 140, align: 'right', lineBreak: false });
    doc.text('', { lineBreak: true });
    yPosition = doc.y + 3;

    const roleText = exp.location ? `${exp.role}  \u2022  ${exp.location}` : exp.role;
    doc.font(regularFont)
      .fontSize(ROLE_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(roleText, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
    yPosition = doc.y + 4;

    for (const achievement of exp.achievements) {
      yPosition = checkPageBreak(18, yPosition);
      const bulletText = `\u2022  ${achievement}`;
      doc.font(regularFont)
        .fontSize(BODY_FONT_SIZE)
        .fillColor(DARK_GRAY)
        .text(bulletText, PAGE_MARGIN + 8, yPosition, { width: CONTENT_WIDTH - 8, lineGap: 1 });
      yPosition = doc.y + 2;
    }

    if (exp.techStack) {
      doc.font(boldFont)
        .fontSize(TECH_STACK_SIZE)
        .fillColor(BLACK)
        .text(`Tech: ${exp.techStack}`, PAGE_MARGIN + 8, yPosition, { width: CONTENT_WIDTH - 8 });
      yPosition = doc.y + 4;
    }

    yPosition += PARAGRAPH_GAP;
  }

  return yPosition;
}

function renderTechnicalSkillsSection({
  doc,
  data,
  yPosition,
  checkPageBreak,
  boldFont,
  regularFont,
}: SectionRenderContext): number {
  // ========== TECHNICAL SKILLS ==========
  yPosition = checkPageBreak(60, yPosition);
  yPosition += 4;
  addSectionTitle(doc, 'TECHNICAL SKILLS', yPosition, boldFont);
  yPosition = doc.y + 6;

  for (const skillGroup of data.technicalSkills) {
    yPosition = checkPageBreak(16, yPosition);

    doc.font(boldFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(DARK_GRAY)
      .text(`${skillGroup.category}:`, PAGE_MARGIN, yPosition, { lineBreak: false });

    const categoryWidth = doc.widthOfString(`${skillGroup.category}: `);

    doc.font(regularFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(skillGroup.skills.join(', '), PAGE_MARGIN + categoryWidth + 4, yPosition, { width: CONTENT_WIDTH - categoryWidth - 4 });
    yPosition = doc.y + 3;
  }

  return yPosition;
}

function renderEducationSection({
  doc,
  data,
  yPosition,
  checkPageBreak,
  boldFont,
  regularFont,
}: SectionRenderContext): number {
  // ========== EDUCATION ==========
  yPosition = checkPageBreak(50, yPosition);
  yPosition += 6;
  addSectionTitle(doc, 'EDUCATION', yPosition, boldFont);
  yPosition = doc.y + 8;

  for (const edu of data.education) {
    yPosition = checkPageBreak(30, yPosition);

    doc.font(boldFont)
      .fontSize(ROLE_FONT_SIZE)
      .fillColor(BLACK)
      .text(edu.degree, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH - 80, lineBreak: false });

    doc.font(regularFont)
      .fontSize(CONTACT_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(edu.year, doc.page.width - PAGE_MARGIN - 80, yPosition, { width: 80, align: 'right', lineBreak: false });
    doc.text('', { lineBreak: true });
    yPosition = doc.y + 2;

    doc.font(regularFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(edu.institution, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
    yPosition = doc.y + 2;

    if (edu.details) {
      doc.font(regularFont)
        .fontSize(CONTACT_FONT_SIZE)
        .fillColor(LIGHT_GRAY)
        .text(edu.details, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
      yPosition = doc.y + 4;
    }
    yPosition += 4;
  }

  return yPosition;
}
```

- [ ] **Step 5: Run the source test and lint to verify the generator change**

Run:

```bash
node --test tests/technical-skills-order-source.test.mjs
npm run lint
```

Expected: source tests PASS. `npm run lint` exits with code 0.

- [ ] **Step 6: Commit the generator change**

```bash
git add lib/pdf/generator.ts tests/technical-skills-order-source.test.mjs
git commit -m "feat: support conditional PDF section ordering"
```

### Task 4: API Route Wrapped And Raw Request Support

**Files:**
- Modify: `tests/technical-skills-order-source.test.mjs`
- Modify: `app/api/generate-pdf/route.ts:1-51`
- Test: `tests/technical-skills-order-source.test.mjs`

- [ ] **Step 1: Extend the source test for API request parsing**

In `tests/technical-skills-order-source.test.mjs`, add this source read after the `generatorSource` line:

```js
const apiRouteSource = await readFile(new URL('../app/api/generate-pdf/route.ts', import.meta.url), 'utf8');
```

Add this test after the generator test:

```js
test('API route accepts wrapped and raw CV request bodies', () => {
  assert.match(
    apiRouteSource,
    /import type \{ PDFGenerationOptions \} from '@\/lib\/pdf\/generator';/,
  );
  assert.match(
    apiRouteSource,
    /function getGeneratePdfPayload\(body: unknown\): \{ cvData: unknown; options: PDFGenerationOptions \}/,
  );
  assert.match(apiRouteSource, /'cvData' in body/);
  assert.match(apiRouteSource, /return \{ cvData: body\.cvData, options: normalizeGeneratePdfOptions\(body\.options\) \};/);
  assert.match(apiRouteSource, /return \{ cvData: body, options: \{\} \};/);
  assert.match(apiRouteSource, /const validationResult = CVDataSchema\.safeParse\(cvData\);/);
  assert.match(apiRouteSource, /const pdfBuffer = await generatePDFBuffer\(validationResult\.data, options\);/);
});
```

- [ ] **Step 2: Run the API route test to verify it fails**

Run:

```bash
node --test tests/technical-skills-order-source.test.mjs
```

Expected: FAIL for `API route accepts wrapped and raw CV request bodies` because the route still validates the whole raw body and does not pass options to the generator.

- [ ] **Step 3: Add request parsing helpers and pass options to the generator**

In `app/api/generate-pdf/route.ts`, add this import after the existing generator import:

```ts
import type { PDFGenerationOptions } from '@/lib/pdf/generator';
```

Add these helper functions after `export const runtime = 'nodejs';`:

```ts
function getGeneratePdfPayload(body: unknown): { cvData: unknown; options: PDFGenerationOptions } {
  if (isWrappedGeneratePdfRequest(body)) {
    return { cvData: body.cvData, options: normalizeGeneratePdfOptions(body.options) };
  }

  return { cvData: body, options: {} };
}

function isWrappedGeneratePdfRequest(
  body: unknown,
): body is { cvData: unknown; options?: unknown } {
  return typeof body === 'object' && body !== null && 'cvData' in body;
}

function normalizeGeneratePdfOptions(options: unknown): PDFGenerationOptions {
  if (typeof options !== 'object' || options === null) {
    return {};
  }

  const candidate = options as { placeTechnicalSkillsAfterSummary?: unknown };

  return {
    placeTechnicalSkillsAfterSummary:
      typeof candidate.placeTechnicalSkillsAfterSummary === 'boolean'
        ? candidate.placeTechnicalSkillsAfterSummary
        : false,
  };
}
```

Inside `POST`, replace:

```ts
    const body = await request.json();

    // Validate input with Zod
    const validationResult = CVDataSchema.safeParse(body);
```

with:

```ts
    const body = await request.json();
    const { cvData, options } = getGeneratePdfPayload(body);

    // Validate input with Zod
    const validationResult = CVDataSchema.safeParse(cvData);
```

Replace:

```ts
    const pdfBuffer = await generatePDFBuffer(validationResult.data);
```

with:

```ts
    const pdfBuffer = await generatePDFBuffer(validationResult.data, options);
```

- [ ] **Step 4: Run the source test and lint to verify the API route change**

Run:

```bash
node --test tests/technical-skills-order-source.test.mjs
npm run lint
```

Expected: source tests PASS. `npm run lint` exits with code 0.

- [ ] **Step 5: Commit the API route change**

```bash
git add app/api/generate-pdf/route.ts tests/technical-skills-order-source.test.mjs
git commit -m "feat: accept PDF generation options payload"
```

### Task 5: Full Verification

**Files:**
- No source changes.
- Test: all existing Node source tests and lint.

- [ ] **Step 1: Run all Node source tests**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: PASS for:

```text
tests/cv-preview-source.test.mjs
tests/pdf-performance-source.test.mjs
tests/technical-skills-order-source.test.mjs
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff --stat HEAD
git diff HEAD -- lib/context/CvContext.tsx app/page.tsx app/api/generate-pdf/route.ts lib/pdf/generator.ts tests/technical-skills-order-source.test.mjs
```

Expected: diff includes only the context setting, header checkbox, route body parser, generator ordering helpers, and source tests described in this plan.

## Self-Review

- Spec coverage: Task 1 covers UI-only context state, payload wrapping, default `false`, clearing generated PDF and error state on checkbox changes, and keeping download disabled by clearing `pdfUrl`. Task 2 covers the user-facing checkbox near existing top controls. Task 3 covers generator options, helper extraction, Professional Summary first, Education last, and conditional Technical Skills placement. Task 4 covers wrapped request parsing and backward-compatible raw CV requests. Task 5 covers lint and all Node tests.
- Placeholder scan: The plan contains exact file paths, code snippets, commands, and expected outcomes for each task.
- Type consistency: The shared option name is `placeTechnicalSkillsAfterSummary` in context state, request payload, route parsing, `PDFGenerationOptions`, and generator conditional logic.
