import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const contextSource = await readFile(new URL('../lib/context/CvContext.tsx', import.meta.url), 'utf8');
const generatorSource = await readFile(new URL('../lib/pdf/generator.ts', import.meta.url), 'utf8');
const pdfPreviewDocumentSource = await readFile(
  new URL('../components/PdfPreviewDocument.tsx', import.meta.url),
  'utf8',
);

test('uses a local optimized photo asset by default', async () => {
  assert.match(contextSource, /"photo": "\/cv-photo\.jpg"/);
  assert.doesNotMatch(contextSource, /raw\.githubusercontent\.com/);

  const optimizedPhoto = await stat(new URL('../public/cv-photo.jpg', import.meta.url));
  assert.ok(
    optimizedPhoto.size < 50_000,
    `expected optimized photo to stay under 50 KB, got ${optimizedPhoto.size} bytes`,
  );
});

test('bounds and caches photo loading during PDF generation', () => {
  assert.match(generatorSource, /PHOTO_FETCH_TIMEOUT_MS\s*=/);
  assert.match(generatorSource, /photoBufferCache/);
  assert.match(generatorSource, /resolvePublicPhotoPath/);
  assert.match(generatorSource, /readFileSync/);
  assert.match(generatorSource, /AbortController/);
  assert.match(generatorSource, /Promise\.race/);
  assert.match(generatorSource, /setTimeout\(/);
});

test('passes PDF blobs to the preview without base64 conversion', () => {
  assert.match(contextSource, /response\.blob\(\)/);
  assert.match(contextSource, /URL\.createObjectURL/);
  assert.match(contextSource, /URL\.revokeObjectURL/);
  assert.doesNotMatch(contextSource, /btoa\(/);
  assert.doesNotMatch(contextSource, /String\.fromCharCode/);
  assert.doesNotMatch(pdfPreviewDocumentSource, /data:application\/pdf;base64/);
});
