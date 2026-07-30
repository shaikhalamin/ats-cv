# README Refresh Design

**Date:** 2026-07-30

## Goal

Replace the generic Create Next App README with a polished, product-first guide for ATS CV Generator. The README should help a visitor understand the product quickly, try the deployed application, customize a CV through JSON, and run or evaluate the codebase locally.

## Audience

The primary audience is public GitHub visitors and prospective users. Developers evaluating, running, or extending the project are the secondary audience.

## Content Structure

The README will use this order:

1. Project title, concise value proposition, technology badges, and a prominent link to the live application at `https://ats-cv-seven.vercel.app`.
2. Feature highlights grounded in the current implementation.
3. A short workflow explaining JSON editing, validation, PDF generation, preview, and download.
4. A compact JSON example plus a field reference covering required and optional CV data.
5. Local development instructions, available npm scripts, tests, production build, and Vercel deployment guidance.
6. A concise repository structure and Mermaid data-flow diagram.
7. The PDF API request shapes, generation options, successful response, and error behavior.
8. The core technology stack.

## Documented Product Behavior

The README will describe only behavior verified in the repository:

- Monaco-based JSON editing.
- JSON syntax and CV schema validation with field-level error messages.
- Server-side PDF generation using PDFKit.
- Browser PDF preview using React PDF, including multi-page rendering and zoom controls.
- PDF download with a filename derived from the CV title and name.
- Optional placement of Technical Skills after Professional Summary.
- Optional Project Showcase rendering.
- Optional photo and social links.
- Reset to the bundled default CV.

## Technical Data Flow

The documented flow is:

1. The user edits JSON in the client.
2. Zod validates the parsed data.
3. Valid data and render options are posted to `/api/generate-pdf`.
4. The Node.js API validates the payload again and generates an A4 PDF with PDFKit.
5. The client creates an object URL from the PDF response for preview and download.

## Error Handling and Validation

The README will explain that invalid JSON or schema violations disable generation and appear in the validation panel. It will also document the API's `400` validation response and `500` generation response without promising a more stable public API contract than the code provides.

## Verification

Before completion:

- Confirm every feature and JSON field against the source.
- Run the source tests, ESLint, and a production build.
- Check Markdown headings, fenced blocks, relative links, and Mermaid syntax.
- Review the final Git diff to ensure only intended documentation changes are included.

## Exclusions

- Do not add a license or claim a license exists.
- Do not invent contribution instructions, environment variables, or unsupported package-manager commands.
- Do not include the entire personal default CV dataset.
- Do not add a product screenshot unless an accurate repository-owned screenshot is available.
