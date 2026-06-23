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
