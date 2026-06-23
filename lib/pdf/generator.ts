import PDFDocument from 'pdfkit';
import { existsSync, readFileSync } from 'fs';
import { join, dirname, normalize, sep } from 'path';
import { fileURLToPath } from 'url';
import type { CVData } from '../schemas/cv.schema';

export interface PDFGenerationOptions {
  placeTechnicalSkillsAfterSummary?: boolean;
}

type CheckPageBreak = (requiredSpace: number, yPosition: number) => number;

interface SectionRenderContext {
  doc: PDFKit.PDFDocument;
  data: CVData;
  yPosition: number;
  checkPageBreak: CheckPageBreak;
  boldFont: string;
  regularFont: string;
}

// Get the directory of this file for reliable path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Colors - professional palette
const BLACK = '#1a1a1a';
const DARK_GRAY = '#2d2d2d';
const MEDIUM_GRAY = '#555555';
const LIGHT_GRAY = '#888888';
const LINK_COLOR = '#2563eb';
const SECTION_LINE_COLOR = '#e5e7eb';
const PHOTO_FETCH_TIMEOUT_MS = 1500;

const photoBufferCache = new Map<string, Buffer | null>();

/**
 * Find font directory by checking multiple paths
 */
function findFontsDirectory(): string | null {
  const projectRoot = join(__dirname, '..', '..', '..');
  const fontPaths = [
    join(projectRoot, 'public', 'fonts'),
    join(process.cwd(), 'public', 'fonts'),
    join(process.cwd(), 'fonts'),
    '/var/task/public/fonts',
    './public/fonts',
  ];

  for (const path of fontPaths) {
    const regularFontPath = join(path, 'Roboto-Regular.ttf');
    if (existsSync(regularFontPath)) {
      return path;
    }
  }
  return null;
}

/**
 * Fetch photo from URL or convert base64 to buffer
 */
async function getPhotoBuffer(photoData: string): Promise<Buffer | null> {
  if (photoBufferCache.has(photoData)) {
    return photoBufferCache.get(photoData) ?? null;
  }

  const photoBuffer = await loadPhotoBuffer(photoData);
  photoBufferCache.set(photoData, photoBuffer);

  return photoBuffer;
}

async function loadPhotoBuffer(photoData: string): Promise<Buffer | null> {
  try {
    if (photoData.startsWith('http://') || photoData.startsWith('https://')) {
      return await loadRemotePhotoBuffer(photoData);
    } else if (photoData.startsWith('data:')) {
      // Extract base64 from data URL
      const base64Data = photoData.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    } else if (photoData.startsWith('/')) {
      const publicPhotoPath = resolvePublicPhotoPath(photoData);
      return publicPhotoPath ? readFileSync(publicPhotoPath) : null;
    } else {
      // Assume raw base64
      return Buffer.from(photoData, 'base64');
    }
  } catch (error) {
    console.warn('Failed to load photo:', error);
    return null;
  }
}

async function loadRemotePhotoBuffer(photoData: string): Promise<Buffer | null> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, PHOTO_FETCH_TIMEOUT_MS);
  });

  const fetchPromise = fetch(photoData, { signal: controller.signal })
    .then(async (response) => {
      if (!response.ok) {
        console.warn(`Failed to fetch image: ${response.status}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    })
    .catch((error) => {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      throw error;
    });

  try {
    const result = await Promise.race([fetchPromise, timeoutPromise]);

    if (!result) {
      console.warn(`Timed out loading photo after ${PHOTO_FETCH_TIMEOUT_MS}ms`);
    }

    return result;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function resolvePublicPhotoPath(photoData: string): string | null {
  const publicRoot = normalize(join(process.cwd(), 'public'));
  const normalizedPhotoPath = normalize(join(publicRoot, photoData.replace(/^\/+/, '')));

  if (normalizedPhotoPath !== publicRoot && !normalizedPhotoPath.startsWith(`${publicRoot}${sep}`)) {
    return null;
  }

  return existsSync(normalizedPhotoPath) ? normalizedPhotoPath : null;
}

/**
 * Generate PDF from CV data and return as Buffer
 */
export async function generatePDFBuffer(
  data: CVData,
  options: PDFGenerationOptions = {},
): Promise<Buffer> {
  // Fetch photo buffer before creating PDF (if URL provided)
  const photoBuffer = data.personalDetails.photo
    ? await getPhotoBuffer(data.personalDetails.photo)
    : null;

  return new Promise((resolve, reject) => {
    try {
      // Find fonts directory first
      const fontsDir = findFontsDirectory();

      if (!fontsDir) {
        reject(new Error('Font files not found. Please ensure Roboto fonts are in public/fonts/'));
        return;
      }

      const boldFontPath = join(fontsDir, 'Roboto-Bold.ttf');
      const regularFontPath = join(fontsDir, 'Roboto-Regular.ttf');

      // Font names after registration
      const boldFont = 'Roboto-Bold';
      const regularFont = 'Roboto';

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

      // Register fonts immediately after document creation
      doc.registerFont('Roboto', regularFontPath);
      doc.registerFont('Roboto-Bold', boldFontPath);

      // Set default font
      doc.font('Roboto');

      // Collect PDF chunks
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      let yPosition = PAGE_MARGIN;

      // Helper to check and handle page breaks
      const checkPageBreak: CheckPageBreak = (requiredSpace, currentYPosition) => {
        if (doc.y + requiredSpace > doc.page.height - PAGE_MARGIN) {
          doc.addPage();
          return PAGE_MARGIN;
        }

        return currentYPosition;
      };

      // ========== HEADER ==========
      // Photo dimensions and positioning
      const PHOTO_SIZE = 70; // Standard photo size (square)
      const PHOTO_MARGIN = 10;
      const hasPhoto = data.personalDetails.photo && data.personalDetails.photo.length > 0;

      // Photo position in top right corner
      const photoX = doc.page.width - PAGE_MARGIN - PHOTO_SIZE;
      const photoY = PAGE_MARGIN;

      // Draw photo if available
      if (hasPhoto && photoBuffer) {
        try {
          // First, get image dimensions by loading it temporarily
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const img = (doc as any).openImage(photoBuffer);
          const imgWidth = img.width;
          const imgHeight = img.height;

          // Calculate scale to cover the square (use larger scale factor)
          const scaleX = PHOTO_SIZE / imgWidth;
          const scaleY = PHOTO_SIZE / imgHeight;
          const scale = Math.max(scaleX, scaleY); // Use max to cover

          // Calculate scaled dimensions
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;

          // Center the image within the square
          const imgX = photoX - (scaledWidth - PHOTO_SIZE) / 2;
          const imgY = photoY - (scaledHeight - PHOTO_SIZE) / 2;

          // Use clipping path to crop image to square
          doc.save();
          doc.rect(photoX, photoY, PHOTO_SIZE, PHOTO_SIZE);
          doc.clip();

          // Add the scaled and centered image
          doc.image(img, imgX, imgY, {
            width: scaledWidth,
            height: scaledHeight,
          });
          doc.restore();

          // Add subtle border around photo (square)
          doc.rect(photoX, photoY, PHOTO_SIZE, PHOTO_SIZE)
            .lineWidth(1)
            .strokeColor(SECTION_LINE_COLOR)
            .stroke();
        } catch (error) {
          console.warn('Failed to draw photo:', error);
        }
      }

      // Calculate available width for text (accounting for photo if present)
      const textWidth = hasPhoto ? CONTENT_WIDTH - PHOTO_SIZE - PHOTO_MARGIN : CONTENT_WIDTH;
      const textStartX = PAGE_MARGIN;

      // Name - Large, bold, centered (or left-aligned if photo exists)
      if (hasPhoto) {
        doc.font(boldFont)
          .fontSize(NAME_FONT_SIZE)
          .fillColor(BLACK)
          .text(data.personalDetails.name, textStartX, yPosition, {
            width: textWidth,
            align: 'left',
          });
      } else {
        doc.font(boldFont)
          .fontSize(NAME_FONT_SIZE)
          .fillColor(BLACK)
          .text(data.personalDetails.name, { align: 'center' });
      }
      yPosition = doc.y + 4;

      // Title - Bold and prominent (aligned with name)
      doc.font(boldFont)
        .fontSize(TITLE_FONT_SIZE + 3)
        .fillColor(DARK_GRAY);
      if (hasPhoto) {
        doc.text(data.personalDetails.title, textStartX, yPosition, {
          width: textWidth,
          align: 'left',
        });
      } else {
        doc.text(data.personalDetails.title, { align: 'center' });
      }
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

      // Position contact line based on photo presence
      let contactX: number;
      if (hasPhoto) {
        // Left-align within the text area
        contactX = textStartX;
      } else {
        // Center on page
        contactX = centerX - totalContactWidth / 2;
      }

      for (let i = 0; i < contactItems.length; i++) {
        const item = contactItems[i];
        const itemWidth = doc.widthOfString(item.text);

        if (i > 0) {
          doc.fillColor(LIGHT_GRAY).text(separator, contactX, contactY);
          contactX += doc.widthOfString(separator);
        }

        if (item.link) {
          doc.fillColor(LINK_COLOR).text(item.text, contactX, contactY, { link: item.link, underline: false });
          doc.link(contactX, contactY, itemWidth, doc.currentLineHeight(), item.link);
        } else {
          doc.fillColor(DARK_GRAY).text(item.text, contactX, contactY);
        }
        contactX += itemWidth;
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

        // Position social links based on photo presence
        let socialX: number;
        if (hasPhoto) {
          // Left-align within the text area
          socialX = textStartX;
        } else {
          // Center on page
          socialX = centerX - totalSocialWidth / 2;
        }

        for (let i = 0; i < socialItems.length; i++) {
          const item = socialItems[i];
          const itemWidth = doc.widthOfString(item.text);

          if (i > 0) {
            doc.fillColor(LIGHT_GRAY).text(separator, socialX, socialY);
            socialX += doc.widthOfString(separator);
          }

          doc.font(regularFont).fontSize(CONTACT_FONT_SIZE).fillColor(LINK_COLOR)
            .text(item.text, socialX, socialY);
          doc.link(socialX, socialY, itemWidth, doc.currentLineHeight(), item.url);
          socialX += itemWidth;
        }
        yPosition = socialY + 16;
      }

      // Ensure yPosition is below the photo if present
      if (hasPhoto) {
        const photoBottom = photoY + PHOTO_SIZE + PHOTO_MARGIN;
        if (yPosition < photoBottom) {
          yPosition = photoBottom;
        }
      }

      // Header separator line
      doc.moveTo(PAGE_MARGIN, yPosition)
        .lineTo(doc.page.width - PAGE_MARGIN, yPosition)
        .strokeColor(SECTION_LINE_COLOR)
        .lineWidth(1)
        .stroke();
      yPosition += SECTION_GAP + 4;

      // ========== PROFESSIONAL SUMMARY ==========
      addSectionTitle(doc, 'PROFESSIONAL SUMMARY', yPosition, boldFont);
      yPosition = doc.y + 6;

      doc.font(regularFont)
        .fontSize(BODY_FONT_SIZE + 0.5)
        .fillColor(DARK_GRAY)
        .text(data.professionalSummary, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH, lineGap: 2 });
      yPosition = doc.y + SECTION_GAP;

      if (options.placeTechnicalSkillsAfterSummary) {
        yPosition = renderTechnicalSkillsSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
        yPosition = renderExperienceSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
      } else {
        yPosition = renderExperienceSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
        yPosition = renderTechnicalSkillsSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
      }

      if (data.projects?.length) {
        yPosition = renderProjectShowcaseSection({
          doc,
          data,
          yPosition,
          checkPageBreak,
          boldFont,
          regularFont,
        });
      }

      yPosition = renderEducationSection({
        doc,
        data,
        yPosition,
        checkPageBreak,
        boldFont,
        regularFont,
      });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function renderExperienceSection({
  doc,
  data,
  yPosition,
  checkPageBreak,
  boldFont,
  regularFont,
}: SectionRenderContext): number {
  // ========== EXPERIENCE ==========
  addSectionTitle(doc, 'EXPERIENCE', yPosition, boldFont);
  yPosition = doc.y + 8;

  for (const exp of data.experience) {
    yPosition = checkPageBreak(80, yPosition);

    doc.font(boldFont)
      .fontSize(COMPANY_FONT_SIZE)
      .fillColor(BLACK)
      .text(exp.company, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH - 140, lineBreak: false });

    doc.font(regularFont)
      .fontSize(CONTACT_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(exp.period, doc.page.width - PAGE_MARGIN - 140, yPosition, { width: 140, align: 'right', lineBreak: false });
    doc.text('', { lineBreak: true });
    yPosition = doc.y + 3;

    const roleText = exp.location ? `${exp.role}  \u2022  ${exp.location}` : exp.role;
    doc.font(regularFont)
      .fontSize(ROLE_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(roleText, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
    yPosition = doc.y + 4;

    for (const achievement of exp.achievements) {
      yPosition = checkPageBreak(18, yPosition);
      const bulletText = `\u2022  ${achievement}`;
      doc.font(regularFont)
        .fontSize(BODY_FONT_SIZE)
        .fillColor(DARK_GRAY)
        .text(bulletText, PAGE_MARGIN + 8, yPosition, { width: CONTENT_WIDTH - 8, lineGap: 1 });
      yPosition = doc.y + 2;
    }

    if (exp.techStack) {
      doc.font(boldFont)
        .fontSize(TECH_STACK_SIZE)
        .fillColor(BLACK)
        .text(`Tech: ${exp.techStack}`, PAGE_MARGIN + 8, yPosition, { width: CONTENT_WIDTH - 8 });
      yPosition = doc.y + 4;
    }

    yPosition += PARAGRAPH_GAP;
  }

  return yPosition;
}

function renderTechnicalSkillsSection({
  doc,
  data,
  yPosition,
  checkPageBreak,
  boldFont,
  regularFont,
}: SectionRenderContext): number {
  // ========== TECHNICAL SKILLS ==========
  yPosition = checkPageBreak(60, yPosition);
  yPosition += 4;
  addSectionTitle(doc, 'TECHNICAL SKILLS', yPosition, boldFont);
  yPosition = doc.y + 6;

  for (const skillGroup of data.technicalSkills) {
    yPosition = checkPageBreak(16, yPosition);

    doc.font(boldFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(DARK_GRAY)
      .text(`${skillGroup.category}:`, PAGE_MARGIN, yPosition, { lineBreak: false });

    const categoryWidth = doc.widthOfString(`${skillGroup.category}: `);

    doc.font(regularFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(skillGroup.skills.join(', '), PAGE_MARGIN + categoryWidth + 4, yPosition, { width: CONTENT_WIDTH - categoryWidth - 4 });
    yPosition = doc.y + 3;
  }

  return yPosition;
}

function renderProjectShowcaseSection({
  doc,
  data,
  yPosition,
  checkPageBreak,
  boldFont,
  regularFont,
}: SectionRenderContext): number {
  if (!data.projects?.length) {
    return yPosition;
  }

  // ========== PROJECT SHOWCASE ==========
  yPosition = checkPageBreak(70, yPosition);
  yPosition += 6;
  addSectionTitle(doc, 'PROJECT SHOWCASE', yPosition, boldFont);
  yPosition = doc.y + 8;

  for (const project of data.projects) {
    yPosition = checkPageBreak(72, yPosition);

    doc.font(boldFont)
      .fontSize(ROLE_FONT_SIZE)
      .fillColor(BLACK)
      .text(project.name, PAGE_MARGIN, yPosition, {
        width: CONTENT_WIDTH,
        link: project.link,
        underline: false,
      });
    yPosition = doc.y + 2;

    doc.font(regularFont)
      .fontSize(CONTACT_FONT_SIZE)
      .fillColor(LINK_COLOR)
      .text(project.link, PAGE_MARGIN, yPosition, {
        width: CONTENT_WIDTH,
        link: project.link,
        underline: false,
      });
    yPosition = doc.y + 4;

    doc.font(regularFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(DARK_GRAY)
      .text(project.description, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH, lineGap: 1 });
    yPosition = doc.y + 3;

    doc.font(boldFont)
      .fontSize(TECH_STACK_SIZE)
      .fillColor(BLACK)
      .text(`Tools: ${project.tools.join(', ')}`, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
    yPosition = doc.y + PARAGRAPH_GAP;
  }

  return yPosition;
}

function renderEducationSection({
  doc,
  data,
  yPosition,
  checkPageBreak,
  boldFont,
  regularFont,
}: SectionRenderContext): number {
  // ========== EDUCATION ==========
  yPosition = checkPageBreak(50, yPosition);
  yPosition += 6;
  addSectionTitle(doc, 'EDUCATION', yPosition, boldFont);
  yPosition = doc.y + 8;

  for (const edu of data.education) {
    yPosition = checkPageBreak(30, yPosition);

    doc.font(boldFont)
      .fontSize(ROLE_FONT_SIZE)
      .fillColor(BLACK)
      .text(edu.degree, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH - 80, lineBreak: false });

    doc.font(regularFont)
      .fontSize(CONTACT_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(edu.year, doc.page.width - PAGE_MARGIN - 80, yPosition, { width: 80, align: 'right', lineBreak: false });
    doc.text('', { lineBreak: true });
    yPosition = doc.y + 2;

    doc.font(regularFont)
      .fontSize(BODY_FONT_SIZE)
      .fillColor(MEDIUM_GRAY)
      .text(edu.institution, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
    yPosition = doc.y + 2;

    if (edu.details) {
      doc.font(regularFont)
        .fontSize(CONTACT_FONT_SIZE)
        .fillColor(LIGHT_GRAY)
        .text(edu.details, PAGE_MARGIN, yPosition, { width: CONTENT_WIDTH });
      yPosition = doc.y + 4;
    }
    yPosition += 4;
  }

  return yPosition;
}

function addSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number, font: string): void {
  // Section title with accent color
  doc.font(font)
    .fontSize(SECTION_TITLE_SIZE)
    .fillColor(BLACK)
    .text(title, PAGE_MARGIN, y, { width: CONTENT_WIDTH });

  const textY = doc.y + 2;

  // Full-width black underline
  doc.moveTo(PAGE_MARGIN, textY)
    .lineTo(doc.page.width - PAGE_MARGIN, textY) // Full content width
    .strokeColor(BLACK)
    .lineWidth(1)
    .stroke();

  doc.y = textY + 2;
}
