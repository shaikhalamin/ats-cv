#!/usr/bin/env bun
import PDFDocument from 'pdfkit';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Types for CV data
interface PersonalDetails {
  name: string;
  title: string;
  phone: string;
  email: string;
  location: string;
}

interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

interface Experience {
  company: string;
  role: string;
  period: string;
  location?: string;
  achievements: string[];
  techStack?: string;
}

interface TechnicalSkill {
  category: string;
  skills: string[];
}

interface Education {
  degree: string;
  institution: string;
  year: string;
  details?: string;
}

interface CVData {
  personalDetails: PersonalDetails;
  socialLinks: SocialLinks;
  professionalSummary: string;
  experience: Experience[];
  technicalSkills: TechnicalSkill[];
  education: Education[];
}

// PDF configuration - improved spacing
const PAGE_MARGIN = 45;
const CONTENT_WIDTH = 522; // 612 (A4 width) - 2 * margin

// Font sizes - refined hierarchy
const NAME_FONT_SIZE = 22;
const TITLE_FONT_SIZE = 11;
const CONTACT_FONT_SIZE = 9;
const SECTION_TITLE_SIZE = 11;
const COMPANY_FONT_SIZE = 11;
const ROLE_FONT_SIZE = 10;
const BODY_FONT_SIZE = 9;
const TECH_STACK_SIZE = 8;

// Spacing
const SECTION_GAP = 12;
const PARAGRAPH_GAP = 6;
const LINE_GAP = 3;

// Colors - professional palette
const BLACK = '#1a1a1a';
const DARK_GRAY = '#2d2d2d';
const MEDIUM_GRAY = '#555555';
const LIGHT_GRAY = '#888888';
const ACCENT_COLOR = '#2563eb'; // Professional blue
const LINK_COLOR = '#2563eb';
const SECTION_LINE_COLOR = '#e5e7eb';

/**
 * Load CV data from JSON file
 */
function loadCVData(filePath: string): CVData {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as CVData;
}

/**
 * Generate PDF from CV data
 */
function generatePDF(data: CVData, outputPath: string): void {
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: PAGE_MARGIN,
      bottom: PAGE_MARGIN,
      left: PAGE_MARGIN,
      right: PAGE_MARGIN,
    },
    info: {
      Title: `CV - ${data.personalDetails.name}`,
      Author: data.personalDetails.name,
    },
  });

  // Collect PDF chunks
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    writeFileSync(outputPath, pdfBuffer);
    console.log(`CV generated successfully: ${outputPath}`);
  });

  // Register professional fonts
  const fontsDir = join(process.cwd(), 'fonts');
  doc.registerFont('Roboto', join(fontsDir, 'Roboto-Regular.ttf'));
  doc.registerFont('Roboto-Bold', join(fontsDir, 'Roboto-Bold.ttf'));
  doc.registerFont('Roboto-Light', join(fontsDir, 'Roboto-Light.ttf'));

  const boldFont = 'Roboto-Bold';
  const regularFont = 'Roboto';
  const lightFont = 'Roboto-Light';

  let yPosition = PAGE_MARGIN;

  // Helper to check and handle page breaks
  const checkPageBreak = (requiredSpace: number): boolean => {
    if (doc.y + requiredSpace > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      yPosition = PAGE_MARGIN;
      return true;
    }
    return false;
  };

  // ========== HEADER ==========
  // Name - Large, bold, centered
  doc.font(boldFont)
    .fontSize(NAME_FONT_SIZE)
    .fillColor(BLACK)
    .text(data.personalDetails.name, { align: 'center' });
  yPosition = doc.y + 4;

  // Title - Lighter, smaller
  doc.font(regularFont)
    .fontSize(TITLE_FONT_SIZE)
    .fillColor(MEDIUM_GRAY)
    .text(data.personalDetails.title, { align: 'center' });
  yPosition = doc.y + 10;

  // Contact line with clickable links
  const separator = '  \u2022  ';
  doc.font(regularFont).fontSize(CONTACT_FONT_SIZE);

  const centerX = doc.page.width / 2;
  const contactY = yPosition;

  // Build contact items
  const contactItems: { text: string; link?: string }[] = [];
  if (data.personalDetails.email) contactItems.push({ text: data.personalDetails.email, link: `mailto:${data.personalDetails.email}` });
  if (data.personalDetails.phone) contactItems.push({ text: data.personalDetails.phone });
  if (data.personalDetails.location) contactItems.push({ text: data.personalDetails.location });

  const totalContactWidth = contactItems.reduce((acc, item, i) => {
    return acc + doc.widthOfString(item.text) + (i > 0 ? doc.widthOfString(separator) : 0);
  }, 0);
  let contactX = centerX - totalContactWidth / 2;

  for (let i = 0; i < contactItems.length; i++) {
    const item = contactItems[i];
    const textWidth = doc.widthOfString(item.text);

    if (i > 0) {
      doc.fillColor(LIGHT_GRAY).text(separator, contactX, contactY);
      contactX += doc.widthOfString(separator);
    }

    if (item.link) {
      doc.fillColor(LINK_COLOR).text(item.text, contactX, contactY, { link: item.link, underline: false });
      // Add link annotation manually
      doc.link(contactX, contactY, textWidth, doc.currentLineHeight(), item.link);
    } else {
      doc.fillColor(DARK_GRAY).text(item.text, contactX, contactY);
    }
    contactX += textWidth;
  }
  yPosition = contactY + 12;

  // Social links with clickable URLs
  const socialItems: { text: string; url: string }[] = [];
  if (data.socialLinks.github) socialItems.push({ text: data.socialLinks.github, url: `https://${data.socialLinks.github}` });
  if (data.socialLinks.linkedin) socialItems.push({ text: data.socialLinks.linkedin, url: `https://${data.socialLinks.linkedin}` });
  if (data.socialLinks.portfolio) socialItems.push({ text: data.socialLinks.portfolio, url: `https://${data.socialLinks.portfolio}` });

  if (socialItems.length > 0) {
    const socialY = yPosition;
    const totalSocialWidth = socialItems.reduce((acc, item, i) => {
      return acc + doc.widthOfString(item.text) + (i > 0 ? doc.widthOfString(separator) : 0);
    }, 0);
    let socialX = centerX - totalSocialWidth / 2;

    for (let i = 0; i < socialItems.length; i++) {
      const item = socialItems[i];
      const textWidth = doc.widthOfString(item.text);

      if (i > 0) {
        doc.fillColor(LIGHT_GRAY).text(separator, socialX, socialY);
        socialX += doc.widthOfString(separator);
      }

      doc.font(regularFont).fontSize(CONTACT_FONT_SIZE).fillColor(LINK_COLOR)
        .text(item.text, socialX, socialY);
      doc.link(socialX, socialY, textWidth, doc.currentLineHeight(), item.url);
      socialX += textWidth;
    }
    yPosition = socialY + 16;
  }

  // Header separator line
  doc.moveTo(PAGE_MARGIN, yPosition)
    .lineTo(doc.page.width - PAGE_MARGIN, yPosition)
    .strokeColor(SECTION_LINE_COLOR)
    .lineWidth(1)
    .stroke();
  yPosition += SECTION_GAP + 4;

  // ========== PROFESSIONAL SUMMARY ==========
  addSectionTitle(doc, 'PROFESSIONAL SUMMARY', yPosition, boldFont, ACCENT_COLOR);
  yPosition = doc.y + 6;

  doc.font(regularFont)
    .fontSize(BODY_FONT_SIZE + 0.5)
    .fillColor(DARK_GRAY)
    .text(data.professionalSummary, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH, lineGap: 2 });
  yPosition = doc.y + SECTION_GAP;

  // ========== EXPERIENCE ==========
  addSectionTitle(doc, 'EXPERIENCE', yPosition, boldFont, ACCENT_COLOR);
  yPosition = doc.y + 8;

  for (const exp of data.experience) {
    checkPageBreak(80);

    // Company name
    doc.font(boldFont)
      .fontSize(COMPANY_FONT_SIZE)
      .fillColor(BLACK)
      .text(exp.company, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH - 140, lineBreak: false });

    // Period - right aligned
    doc.font(regularFont)
      .fontSize(CONTACT_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(exp.period, doc.page.width - PAGE_MARGIN - 140, yPosition, { width: 140, align: 'right', lineBreak: false });
    doc.text('', { lineBreak: true });
    yPosition = doc.y + 1;

    // Role - italic style using light font with color
    doc.font(regularFont)
      .fontSize(ROLE_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(exp.role, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
    yPosition = doc.y + 4;

    // Achievements
    for (const achievement of exp.achievements) {
      checkPageBreak(18);
      const bulletText = `\u2022  ${achievement}`;
      doc.font(regularFont)
        .fontSize(BODY_FONT_SIZE)
        .fillColor(DARK_GRAY)
        .text(bulletText, PAGE_MARGIN + 8, yPosition, { width: CONTENT_WIDTH - 8, lineGap: 1 });
      yPosition = doc.y + 2;
    }

    // Tech Stack
    if (exp.techStack) {
      doc.font(regularFont)
        .fontSize(TECH_STACK_SIZE)
        .fillColor(LIGHT_GRAY)
        .text(`Tech: ${exp.techStack}`, PAGE_MARGIN + 8, yPosition, { width: CONTENT_WIDTH - 8 });
      yPosition = doc.y + 4;
    }

    yPosition += PARAGRAPH_GAP;
  }

  // ========== TECHNICAL SKILLS ==========
  checkPageBreak(60);
  yPosition += 4;
  addSectionTitle(doc, 'TECHNICAL SKILLS', yPosition, boldFont, ACCENT_COLOR);
  yPosition = doc.y + 6;

  for (const skillGroup of data.technicalSkills) {
    checkPageBreak(16);

    // Category in bold
    doc.font(boldFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(DARK_GRAY)
      .text(`${skillGroup.category}:`, PAGE_MARGIN, yPosition, { lineBreak: false });

    const categoryWidth = doc.widthOfString(`${skillGroup.category}: `);

    // Skills in regular
    doc.font(regularFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(skillGroup.skills.join(', '), PAGE_MARGIN + categoryWidth + 4, yPosition, { width: CONTENT_WIDTH - categoryWidth - 4 });
    yPosition = doc.y + 3;
  }

  // ========== EDUCATION ==========
  checkPageBreak(50);
  yPosition += 6;
  addSectionTitle(doc, 'EDUCATION', yPosition, boldFont, ACCENT_COLOR);
  yPosition = doc.y + 8;

  for (const edu of data.education) {
    checkPageBreak(30);

    // Degree
    doc.font(boldFont)
      .fontSize(ROLE_FONT_SIZE)
      .fillColor(BLACK)
      .text(edu.degree, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH - 80, lineBreak: false });

    // Year
    doc.font(regularFont)
      .fontSize(CONTACT_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(edu.year, doc.page.width - PAGE_MARGIN - 80, yPosition, { width: 80, align: 'right', lineBreak: false });
    doc.text('', { lineBreak: true });
    yPosition = doc.y + 2;

    // Institution
    doc.font(regularFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(edu.institution, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
    yPosition = doc.y + 2;

    // Details
    if (edu.details) {
      doc.font(regularFont)
        .fontSize(CONTACT_FONT_SIZE)
        .fillColor(LIGHT_GRAY)
        .text(edu.details, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
      yPosition = doc.y + 4;
    }
    yPosition += 4;
  }

  // Finalize PDF
  doc.end();
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number, font: string, accentColor: string): void {
  // Section title with accent color
  doc.font(font)
    .fontSize(SECTION_TITLE_SIZE)
    .fillColor(BLACK)
    .text(title, PAGE_MARGIN, y, { width: CONTENT_WIDTH });

  const textY = doc.y + 2;

  // Accent underline
  doc.moveTo(PAGE_MARGIN, textY)
    .lineTo(PAGE_MARGIN + 30, textY) // Short accent line
    .strokeColor(accentColor)
    .lineWidth(2)
    .stroke();

  doc.y = textY + 2;
}

// Main execution
const jsonPath = join(process.cwd(), 'candidate_requirements.json');
const outputPath = join(process.cwd(), 'output', 'cv.pdf');

console.log('Loading candidate requirements from JSON...');
const cvData = loadCVData(jsonPath);

console.log('Generating PDF...');
generatePDF(cvData, outputPath);
