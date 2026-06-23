# Project Showcase Design

## Goal

Add an optional `PROJECT SHOWCASE` section to the CV PDF preview and download. The section appears before Education and is controlled only by the CV JSON: if the `projects` key is missing or an empty array, the section is not rendered.

## Data Model

Add an optional top-level `projects` array to the CV JSON:

```json
"projects": [
  {
    "name": "Multi-Tenant SaaS Dashboard",
    "link": "https://example.com",
    "description": "Built a multi-tenant SaaS dashboard with role-based access, billing workflows, and analytics.",
    "tools": ["Next.js", "NestJS", "PostgreSQL", "Docker"]
  }
]
```

Each project requires:

- `name`: project display name.
- `link`: project URL including a protocol such as `https://`. The project name and visible URL both link to this value.
- `description`: one paragraph string.
- `tools`: non-empty string array.

`projects` itself is optional. Missing `projects` and `"projects": []` are both valid and render no project section.

## Rendering

The PDF section title is `PROJECT SHOWCASE`.

The section renders after Experience and Technical Skills have been rendered in their configured order, and before Education. This preserves the current Technical Skills ordering option while ensuring Project Showcase always sits immediately before Education when present.

Each project entry renders:

1. Project name at the top, clickable with the project `link`.
2. Visible project URL, also clickable with the same `link`.
3. Description paragraph.
4. Tools line formatted as `Tools: Next.js, NestJS, PostgreSQL, Docker`.

Preview and download remain identical because both use the existing generated PDF blob.

## Validation

The Zod schema accepts `projects` as optional. If `projects` exists, every project item must have a non-empty `name`, valid URL `link`, non-empty `description`, and at least one non-empty tool.

The default JSON includes a sample `projects` array so users can copy the expected shape. Removing the key or setting it to an empty array keeps the JSON valid and removes the section from the generated PDF.

## Implementation Notes

Update these areas:

- `lib/schemas/cv.schema.ts`: add `ProjectSchema`, optional `projects`, and exported `Project` type.
- `lib/context/CvContext.tsx`: add default `projects` JSON.
- `lib/pdf/generator.ts`: add `renderProjectShowcaseSection` and call it before Education only when projects exist.
- Tests: add source-level coverage for optional schema behavior, default JSON shape, conditional rendering, section ordering, and clickable link rendering.

## Error Handling

Existing JSON validation handles malformed project entries. Invalid `projects` data blocks preview generation the same way other invalid CV JSON does. Missing or empty `projects` is not an error.

## Testing

Run the existing Node source tests and lint. Add a focused source test for the project showcase feature so future changes do not accidentally make `projects` required or render the section when empty.
