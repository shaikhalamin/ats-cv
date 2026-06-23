import { NextRequest, NextResponse } from 'next/server';
import { CVDataSchema } from '@/lib/schemas/cv.schema';
import { generatePDFBuffer } from '@/lib/pdf/generator';
import type { PDFGenerationOptions } from '@/lib/pdf/generator';

// Force Node.js runtime for PDFKit
export const runtime = 'nodejs';

function getGeneratePdfPayload(body: unknown): { cvData: unknown; options: PDFGenerationOptions } {
  if (isWrappedGeneratePdfRequest(body)) {
    return { cvData: body.cvData, options: normalizeGeneratePdfOptions(body.options) };
  }

  return { cvData: body, options: {} };
}

function isWrappedGeneratePdfRequest(
  body: unknown,
): body is { cvData: unknown; options?: unknown } {
  return typeof body === 'object' && body !== null && 'cvData' in body;
}

function normalizeGeneratePdfOptions(options: unknown): PDFGenerationOptions {
  if (typeof options !== 'object' || options === null) {
    return {};
  }

  const candidate = options as { placeTechnicalSkillsAfterSummary?: unknown };

  return {
    placeTechnicalSkillsAfterSummary:
      typeof candidate.placeTechnicalSkillsAfterSummary === 'boolean'
        ? candidate.placeTechnicalSkillsAfterSummary
        : false,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvData, options } = getGeneratePdfPayload(body);

    // Validate input with Zod
    const validationResult = CVDataSchema.safeParse(cvData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePDFBuffer(validationResult.data, options);

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cv-${validationResult.data.personalDetails.name.replace(/\s+/g, '-')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
