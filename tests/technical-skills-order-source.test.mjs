import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const contextSource = await readFile(new URL('../lib/context/CvContext.tsx', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const generatorSource = await readFile(new URL('../lib/pdf/generator.ts', import.meta.url), 'utf8');
const apiRouteSource = await readFile(new URL('../app/api/generate-pdf/route.ts', import.meta.url), 'utf8');

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
    /body:\s*JSON\.stringify\(\{\s*cvData,\s*options:\s*\{\s*placeTechnicalSkillsAfterSummary,\s*includeProjectShowcase,\s*\},\s*\}\),/,
  );
  assert.match(
    contextSource,
    /\}, \[cvData, placeTechnicalSkillsAfterSummary, includeProjectShowcase, setPdfObjectUrl\]\);/,
  );
  assert.match(
    contextSource,
    /value=\{\{[\s\S]*placeTechnicalSkillsAfterSummary,[\s\S]*setPlaceTechnicalSkillsAfterSummary,[\s\S]*generatePdf,/,
  );
});

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
