# Technical Skills to Experience Spacing Design

## Goal

When **Technical Skills after Professional Summary** is enabled, preserve the standard visual separation between the final Technical Skills row and the Experience heading.

## Root Cause

The Technical Skills renderer returns a vertical position three points below its final row. The Experience renderer begins its heading at that position without adding a leading gap. This leaves only three points between Technical Skills and Experience in the reordered layout.

The existing Technical Skills-to-Education transition adds six more points before the next heading, producing the established nine-point visual separation.

## Design

In the conditional branch where Technical Skills renders before Experience, advance the vertical position by six points after Technical Skills and before Experience.

This focused change must not alter:

- The default Professional Summary, Experience, Technical Skills, Education order.
- Spacing when the checkbox is disabled.
- Technical Skills content or internal row spacing.
- Experience content or internal spacing.
- Checkbox state, PDF request options, or API behavior.

## Page Flow

The existing PDF section renderers and page-break behavior remain unchanged. The additional six points participate in the same vertical-position flow passed to the Experience renderer.

## Testing

Add a regression assertion proving that the reordered generator branch inserts a six-point vertical adjustment between `renderTechnicalSkillsSection` and `renderExperienceSection`.

Verify the change by:

1. Running the focused Node test.
2. Running all Node tests and lint.
3. Generating a reordered PDF and confirming that the visible Technical Skills-to-Experience gap increases from three points to nine points.
4. Generating the default-order PDF and confirming its layout remains unchanged.
