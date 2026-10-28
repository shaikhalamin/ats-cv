import { CVDataSchema } from '@/lib/schemas/cv.schema';
import { generatePDFBuffer } from '@/lib/pdf/generator';
import { DEFAULT_CV_JSON, DEFAULT_RENDER_OPTIONS } from '@/lib/defaultCv';

// Prerendered at build time and served from the CDN, so the home page
// never waits on a serverless PDF generation for the default CV
export const dynamic = 'force-static';

export async function GET() {
  const cvData = CVDataSchema.parse(JSON.parse(DEFAULT_CV_JSON));
  const pdfBuffer = await generatePDFBuffer(cvData, DEFAULT_RENDER_OPTIONS);

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
    },
  });
}
