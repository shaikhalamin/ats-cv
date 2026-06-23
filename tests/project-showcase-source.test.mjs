import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const schemaSource = await readFile(new URL('../lib/schemas/cv.schema.ts', import.meta.url), 'utf8');
const contextSource = await readFile(new URL('../lib/context/CvContext.tsx', import.meta.url), 'utf8');
const generatorSource = await readFile(new URL('../lib/pdf/generator.ts', import.meta.url), 'utf8');

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
  assert.match(contextSource, /"name": "Morning Bakery"/);
  assert.match(contextSource, /"link": "https:\/\/morning-bakery\.vercel\.app\/"/);
  assert.match(contextSource, /"description": "Morning Bakery is an e-commerce web application for selling bakery items\."/);
  assert.match(contextSource, /"tools": \["PHP", "Laravel", "MySQL", "Next\.js", "TypeScript", "Next Auth", "Docker"\]/);
  assert.match(contextSource, /"name": "Property Finder"/);
  assert.match(contextSource, /"link": "https:\/\/property-finder-teal\.vercel\.app\/"/);
  assert.match(contextSource, /"description": "Property Finder is a web app for renting and selling properties\."/);
  assert.match(contextSource, /"tools": \["Node\.js", "NestJS", "TypeScript", "TypeORM", "Postgres", "Next\.js", "Authentication", "Docker"\]/);
  assert.match(contextSource, /"projects":\s*\[[\s\S]*\],[\s\S]*"education":/);
});

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
