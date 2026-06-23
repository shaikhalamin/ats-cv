# Project Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional `PROJECT SHOWCASE` section to the generated CV PDF, controlled entirely by an optional top-level `projects` array in the CV JSON.

**Architecture:** Extend the Zod CV schema and inferred TypeScript data model with optional project entries, add a sample `projects` array to the default JSON, and render the section inside the existing PDFKit generator only when projects are present. Keep preview and download behavior unchanged by using the existing generated PDF blob path, and preserve the current Technical Skills ordering option by inserting Project Showcase after the configured Experience/Technical Skills sequence and before Education.

**Tech Stack:** Next.js App Router, React context, TypeScript, Zod, PDFKit, Node built-in test runner with source-level assertions, ESLint.

---

## File Structure

- Create: `tests/project-showcase-source.test.mjs`
  - Adds focused source-level coverage matching the existing `tests/*.test.mjs` pattern.
  - Covers optional schema shape, exported `Project` type, default JSON sample, conditional PDF rendering, section ordering, tools formatting, and clickable link rendering.
- Modify: `lib/schemas/cv.schema.ts:36-61`
  - Adds `ProjectSchema`.
  - Adds optional `projects` to `CVDataSchema`.
  - Exports the inferred `Project` type.
- Modify: `lib/context/CvContext.tsx:130-184`
  - Adds a sample `projects` array to `DEFAULT_CV_JSON` before `education`.
- Modify: `lib/pdf/generator.ts:438-481,583-624`
  - Calls a new `renderProjectShowcaseSection` after Experience and Technical Skills have rendered in their selected order.
  - Adds the new renderer before `renderEducationSection`.

## Implementation Tasks

### Task 1: Schema And Default JSON

**Files:**
- Create: `tests/project-showcase-source.test.mjs`
- Modify: `lib/schemas/cv.schema.ts:36-61`
- Modify: `lib/context/CvContext.tsx:130-184`
- Test: `tests/project-showcase-source.test.mjs`

- [ ] **Step 1: Write the failing source test for schema and default JSON**

Create `tests/project-showcase-source.test.mjs` with this content:

```js
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const schemaSource = await readFile(new URL('../lib/schemas/cv.schema.ts', import.meta.url), 'utf8');
const contextSource = await readFile(new URL('../lib/context/CvContext.tsx', import.meta.url), 'utf8');

test('schema defines optional project showcase data', () => {
  assert.match(schemaSource, /export const ProjectSchema = z\.object\(\{/);
  assert.match(schemaSource, /name:\s*z\.string\(\)\.min\(1,\s*'Project name is required'\)/);
  assert.match(schemaSource, /link:\s*z\.string\(\)\.url\('Project link must be a valid URL'\)/);
  assert.match(schemaSource, /description:\s*z\.string\(\)\.min\(1,\s*'Project description is required'\)/);
  assert.match(
    schemaSource,
    /tools:\s*z\.array\(z\.string\(\)\.min\(1,\s*'Tool cannot be empty'\)\)\.min\(1,\s*'At least one project tool is required'\)/,
  );
  assert.match(schemaSource, /projects:\s*z\.array\(ProjectSchema\)\.optional\(\)/);
  assert.doesNotMatch(schemaSource, /projects:\s*z\.array\(ProjectSchema\)\.min\(/);
  assert.match(schemaSource, /export type Project = z\.infer<typeof ProjectSchema>;/);
});

test('default CV JSON includes a copyable project showcase sample', () => {
  assert.match(contextSource, /"projects":\s*\[/);
  assert.match(contextSource, /"name": "Multi-Tenant SaaS Dashboard"/);
  assert.match(contextSource, /"link": "https:\/\/example\.com"/);
  assert.match(contextSource, /"description": "Built a multi-tenant SaaS dashboard with role-based access, billing workflows, and analytics\."/);
  assert.match(contextSource, /"tools": \["Next\.js", "NestJS", "PostgreSQL", "Docker"\]/);
  assert.match(contextSource, /"projects":\s*\[[\s\S]*\],[\s\S]*"education":/);
});
```

- [ ] **Step 2: Run the new source test to verify it fails**

Run:

```bash
node --test tests/project-showcase-source.test.mjs
```

Expected: FAIL with the first assertion reporting that `ProjectSchema` is not present in `lib/schemas/cv.schema.ts`.

- [ ] **Step 3: Add `ProjectSchema`, optional `projects`, and `Project` type**

In `lib/schemas/cv.schema.ts`, add this block after `EducationSchema`:

```ts
// Project Schema
export const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  link: z.string().url('Project link must be a valid URL'),
  description: z.string().min(1, 'Project description is required'),
  tools: z.array(z.string().min(1, 'Tool cannot be empty')).min(1, 'At least one project tool is required'),
});
```

Change `CVDataSchema` from:

```ts
export const CVDataSchema = z.object({
  personalDetails: PersonalDetailsSchema,
  socialLinks: SocialLinksSchema,
  professionalSummary: z.string().min(1, 'Professional summary is required'),
  experience: z.array(ExperienceSchema).min(1, 'At least one experience is required'),
  technicalSkills: z.array(TechnicalSkillSchema).min(1, 'At least one skill category is required'),
  education: z.array(EducationSchema).min(1, 'At least one education entry is required'),
});
```

to:

```ts
export const CVDataSchema = z.object({
  personalDetails: PersonalDetailsSchema,
  socialLinks: SocialLinksSchema,
  professionalSummary: z.string().min(1, 'Professional summary is required'),
  experience: z.array(ExperienceSchema).min(1, 'At least one experience is required'),
  technicalSkills: z.array(TechnicalSkillSchema).min(1, 'At least one skill category is required'),
  projects: z.array(ProjectSchema).optional(),
  education: z.array(EducationSchema).min(1, 'At least one education entry is required'),
});
```

Change the type exports from:

```ts
export type Education = z.infer<typeof EducationSchema>;
export type CVData = z.infer<typeof CVDataSchema>;
```

to:

```ts
export type Education = z.infer<typeof EducationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CVData = z.infer<typeof CVDataSchema>;
```

- [ ] **Step 4: Add a sample project to the default CV JSON**

In `lib/context/CvContext.tsx`, insert this top-level JSON property between the closing `technicalSkills` array and the existing `"education"` key:

```json
  "projects": [
    {
      "name": "Multi-Tenant SaaS Dashboard",
      "link": "https://example.com",
      "description": "Built a multi-tenant SaaS dashboard with role-based access, billing workflows, and analytics.",
      "tools": ["Next.js", "NestJS", "PostgreSQL", "Docker"]
    }
  ],
```

The surrounding default JSON should read:

```json
  "technicalSkills": [
    {
      "category": "Architecture & Messaging",
      "skills": [
        "Microservices",
        "Event-Driven Architecture",
        "RabbitMQ",
        "BullMQ",
        "NATS",
        "Redis Pub/Sub"
      ]
    },
    {
      "category": "Programming/Web",
      "skills": [
        "OOP",
        "Node.js",
        "Express",
        "TypeScript",
        "NestJS",
        "React",
        "Next.js",
        "REST",
        "JWT",
        "HTML",
        "CSS",
        "Tailwind"
      ]
    },
    {
      "category": "Database/DBMS",
      "skills": ["MySQL", "PostgreSQL", "Redis", "TypeORM", "Prisma"]
    },
    {
      "category": "SDLC Methodology",
      "skills": ["Agile-Scrum (Jira, Confluence)"]
    },
    {
      "category": "Version Control",
      "skills": ["Git", "BitBucket"]
    },
    {
      "category": "Cloud Platform/VM",
      "skills": ["AWS", "GCP", "VPC", "EC2", "EB", "RDS", "S3", "Docker"]
    }
  ],
  "projects": [
    {
      "name": "Multi-Tenant SaaS Dashboard",
      "link": "https://example.com",
      "description": "Built a multi-tenant SaaS dashboard with role-based access, billing workflows, and analytics.",
      "tools": ["Next.js", "NestJS", "PostgreSQL", "Docker"]
    }
  ],
  "education": [
```

- [ ] **Step 5: Run the focused source test to verify it passes**

Run:

```bash
node --test tests/project-showcase-source.test.mjs
```

Expected: PASS for `schema defines optional project showcase data` and `default CV JSON includes a copyable project showcase sample`.

- [ ] **Step 6: Commit schema and default JSON changes**

```bash
git add lib/schemas/cv.schema.ts lib/context/CvContext.tsx tests/project-showcase-source.test.mjs
git commit -m "feat: add project showcase CV data model"
```

### Task 2: PDF Rendering

**Files:**
- Modify: `tests/project-showcase-source.test.mjs`
- Modify: `lib/pdf/generator.ts:438-481,583-624`
- Test: `tests/project-showcase-source.test.mjs`

- [ ] **Step 1: Extend the source test for Project Showcase PDF rendering**

In `tests/project-showcase-source.test.mjs`, add this source read after the existing `contextSource` line:

```js
const generatorSource = await readFile(new URL('../lib/pdf/generator.ts', import.meta.url), 'utf8');
```

Add this test after the default JSON test:

```js
test('PDF generator conditionally renders Project Showcase before Education', () => {
  assert.match(generatorSource, /function renderProjectShowcaseSection\(/);
  assert.match(
    generatorSource,
    /if \(data\.projects\?\.length\) \{[\s\S]*renderProjectShowcaseSection\([\s\S]*\}[\s\S]*renderEducationSection\(/,
  );
  assert.match(
    generatorSource,
    /if \(options\.placeTechnicalSkillsAfterSummary\) \{[\s\S]*renderTechnicalSkillsSection\([\s\S]*renderExperienceSection\([\s\S]*\} else \{[\s\S]*renderExperienceSection\([\s\S]*renderTechnicalSkillsSection\([\s\S]*\}[\s\S]*if \(data\.projects\?\.length\)/,
  );
  assert.match(generatorSource, /addSectionTitle\(doc,\s*'PROJECT SHOWCASE',\s*yPosition,\s*boldFont\)/);
  assert.match(generatorSource, /\.text\(project\.name,\s*PAGE_MARGIN,\s*yPosition,\s*\{[\s\S]*link: project\.link/);
  assert.match(generatorSource, /\.text\(project\.link,\s*PAGE_MARGIN,\s*yPosition,\s*\{[\s\S]*link: project\.link/);
  assert.match(generatorSource, /\.text\(project\.description,\s*PAGE_MARGIN,\s*yPosition,/);
  assert.match(generatorSource, /`Tools: \$\{project\.tools\.join\(', '\)\}`/);
});
```

- [ ] **Step 2: Run the focused source test to verify it fails**

Run:

```bash
node --test tests/project-showcase-source.test.mjs
```

Expected: FAIL for `PDF generator conditionally renders Project Showcase before Education` because `renderProjectShowcaseSection` is not present in `lib/pdf/generator.ts`.

- [ ] **Step 3: Call the project section before Education**

In `lib/pdf/generator.ts`, replace this block:

```ts
      yPosition = renderEducationSection({
        doc,
        data,
        yPosition,
        checkPageBreak,
        boldFont,
        regularFont,
      });
```

with:

```ts
      if (data.projects?.length) {
        yPosition = renderProjectShowcaseSection({
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

This placement preserves both existing section orders:

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

      if (data.projects?.length) {
        yPosition = renderProjectShowcaseSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
      }

      yPosition = renderEducationSection({
```

- [ ] **Step 4: Add the Project Showcase renderer**

In `lib/pdf/generator.ts`, add this function between `renderTechnicalSkillsSection` and `renderEducationSection`:

```ts
function renderProjectShowcaseSection({
  doc,
  data,
  yPosition,
  checkPageBreak,
  boldFont,
  regularFont,
}: SectionRenderContext): number {
  if (!data.projects?.length) {
    return yPosition;
  }

  // ========== PROJECT SHOWCASE ==========
  yPosition = checkPageBreak(70, yPosition);
  yPosition += 6;
  addSectionTitle(doc, 'PROJECT SHOWCASE', yPosition, boldFont);
  yPosition = doc.y + 8;

  for (const project of data.projects) {
    yPosition = checkPageBreak(72, yPosition);

    doc.font(boldFont)
      .fontSize(ROLE_FONT_SIZE)
      .fillColor(BLACK)
      .text(project.name, PAGE_MARGIN, yPosition, {
        width: CONTENT_WIDTH,
        link: project.link,
        underline: false,
      });
    yPosition = doc.y + 2;

    doc.font(regularFont)
      .fontSize(CONTACT_FONT_SIZE)
      .fillColor(LINK_COLOR)
      .text(project.link, PAGE_MARGIN, yPosition, {
        width: CONTENT_WIDTH,
        link: project.link,
        underline: false,
      });
    yPosition = doc.y + 4;

    doc.font(regularFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(DARK_GRAY)
      .text(project.description, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH, lineGap: 1 });
    yPosition = doc.y + 3;

    doc.font(boldFont)
      .fontSize(TECH_STACK_SIZE)
      .fillColor(BLACK)
      .text(`Tools: ${project.tools.join(', ')}`, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
    yPosition = doc.y + PARAGRAPH_GAP;
  }

  return yPosition;
}
```

- [ ] **Step 5: Run the focused source test to verify it passes**

Run:

```bash
node --test tests/project-showcase-source.test.mjs
```

Expected: PASS for all three project showcase source tests.

- [ ] **Step 6: Commit PDF rendering changes**

```bash
git add lib/pdf/generator.ts tests/project-showcase-source.test.mjs
git commit -m "feat: render project showcase in CV PDF"
```

### Task 3: Full Verification

**Files:**
- Test: `tests/project-showcase-source.test.mjs`
- Test: `tests/cv-preview-source.test.mjs`
- Test: `tests/pdf-performance-source.test.mjs`
- Test: `tests/technical-skills-order-source.test.mjs`

- [ ] **Step 1: Run the full source test suite**

Run:

```bash
node --test tests/*.test.mjs
```

Expected: PASS for all existing source tests and all `tests/project-showcase-source.test.mjs` tests.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS with no ESLint errors.

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff -- lib/schemas/cv.schema.ts lib/context/CvContext.tsx lib/pdf/generator.ts tests/project-showcase-source.test.mjs
```

Expected: The diff only contains the optional project schema/default JSON, the conditional PDF renderer, and focused source tests.

- [ ] **Step 4: Confirm the working tree only contains committed task changes**

Run:

```bash
git status --short
```

Expected: no uncommitted changes for `lib/schemas/cv.schema.ts`, `lib/context/CvContext.tsx`, `lib/pdf/generator.ts`, or `tests/project-showcase-source.test.mjs` after the Task 1 and Task 2 commits.

## Self-Review Checklist

- Spec coverage: `projects` is optional, missing `projects` is valid, an empty array renders no section, project fields require non-empty values, `link` uses Zod URL validation, and `tools` requires at least one non-empty string.
- Rendering coverage: `PROJECT SHOWCASE` renders only when `data.projects?.length` is truthy, appears after the selected Experience/Technical Skills order, and appears before Education.
- Link coverage: project name and visible URL use `project.link` through PDFKit text link options.
- Test coverage: source tests cover schema shape, default JSON shape, conditional rendering, ordering, tools formatting, and link rendering.
