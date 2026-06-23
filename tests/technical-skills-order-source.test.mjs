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
