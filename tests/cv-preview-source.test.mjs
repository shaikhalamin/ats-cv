import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const cvPreviewSource = await readFile(new URL('../components/CvPreview.tsx', import.meta.url), 'utf8');
const pdfPreviewDocumentSource = await readFile(
  new URL('../components/PdfPreviewDocument.tsx', import.meta.url),
  'utf8',
).catch(() => '');

test('configures react-pdf without effect-managed dynamic imports', () => {
  assert.match(cvPreviewSource, /dynamic\(\s*\(\)\s*=>\s*import\('\.\/PdfPreviewDocument'\)/);
  assert.doesNotMatch(cvPreviewSource, /import\('react-pdf'\)/);
  assert.doesNotMatch(cvPreviewSource, /useEffect[\s\S]*pdfjs\.GlobalWorkerOptions\.workerSrc/);
  assert.doesNotMatch(cvPreviewSource, /setPdfjsLoaded|pdfjsLoaded|mounted|setMounted/);

  assert.match(pdfPreviewDocumentSource, /import\s+\{\s*Document,\s*Page,\s*pdfjs\s*\}\s+from\s+'react-pdf'/);
  assert.match(pdfPreviewDocumentSource, /pdfjs\.GlobalWorkerOptions\.workerSrc\s*=\s*new URL\(/);
});

test('keys the loaded page count by the current PDF data', () => {
  assert.match(cvPreviewSource, /loadedDocument\?\.pdfUrl\s*===\s*pdfUrl\s*\?\s*loadedDocument\.numPages\s*:\s*null/);
  assert.match(cvPreviewSource, /setLoadedDocument\(\{\s*pdfUrl,\s*numPages,\s*\}\)/);
  assert.doesNotMatch(cvPreviewSource, /setNumPages\(null\)/);
  assert.match(pdfPreviewDocumentSource, /numPages\s*\?\s*Array\.from\(\{ length: numPages \}/);
});

test('uses shared buttons and accessible icon controls', () => {
  assert.match(cvPreviewSource, /import Button from '\.\/ui\/Button';/);
  assert.match(cvPreviewSource, /aria-label="Zoom out"/);
  assert.match(cvPreviewSource, /aria-label="Zoom in"/);
  assert.match(cvPreviewSource, /aria-hidden="true"/);
});
