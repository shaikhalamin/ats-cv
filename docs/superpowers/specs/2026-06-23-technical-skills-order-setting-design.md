# Technical Skills Order Setting Design

## Goal

Add a render-only checkbox setting that lets the user place the Technical Skills section immediately after Professional Summary in the generated PDF preview and download.

## Current Behavior

The CV JSON contains `professionalSummary`, `experience`, `technicalSkills`, and `education`. The PDF generator currently renders sections in this order:

1. Professional Summary
2. Experience
3. Technical Skills
4. Education

The generated preview and downloaded PDF both come from the same PDF blob in `CvContext`.

## User-Facing Behavior

Add a checkbox setting near the existing top controls. Its label must indicate that Technical Skills will be placed after Professional Summary.

When unchecked, PDF section order stays unchanged:

1. Professional Summary
2. Experience
3. Technical Skills
4. Education

When checked, PDF section order becomes:

1. Professional Summary
2. Technical Skills
3. Experience
4. Education

Changing the checkbox must not edit, reorder, or persist anything into the CV JSON editor. It only affects PDF preview/download rendering.

When the checkbox changes, clear the currently generated PDF and PDF error state. The updated order is applied the next time the user clicks Preview or Refresh. Download continues to download the currently generated PDF, so it is disabled until a PDF exists for the current setting.

## Architecture

Extend `CvContext` with a boolean UI setting:

`placeTechnicalSkillsAfterSummary: boolean`

Expose a setter from the context so the page can update it from the checkbox. Keep the default `false` to preserve current behavior.

Change PDF generation requests from a raw CV object to a wrapped request:

```json
{
  "cvData": { "...": "existing CV data" },
  "options": {
    "placeTechnicalSkillsAfterSummary": true
  }
}
```

The API must remain backward compatible with the previous raw CV object body so older callers still work.

Extend `generatePDFBuffer` to accept an optional options object. The PDF generator must render Professional Summary first, Education last, and choose whether Technical Skills appears before or after Experience based on `placeTechnicalSkillsAfterSummary`.

To keep the generator maintainable, extract section rendering into local helper functions for Experience, Technical Skills, and Education. These helpers must share the existing layout constants, fonts, page-break behavior, and y-position flow.

## Testing

Use test-first changes before implementation.

Add focused source-level tests consistent with the current test style:

1. `CvContext` sends the wrapped `{ cvData, options }` payload and exposes the checkbox setting.
2. `app/page.tsx` renders a checkbox bound to the setting.
3. The API route accepts wrapped requests and still supports raw CV requests.
4. The PDF generator exposes the render option and contains conditional section ordering for Technical Skills before Experience.

Run lint and the existing Node test files after implementation.

## Out of Scope

This change will not add a full drag-and-drop section order editor, persist settings in local storage, rewrite the CV JSON, or change the visual styling of the PDF sections.
