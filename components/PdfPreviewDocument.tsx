'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export interface PdfPreviewDocumentProps {
  pdfUrl: string;
  numPages: number | null;
  scale: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
}

export default function PdfPreviewDocument({
  pdfUrl,
  numPages,
  scale,
  onLoadSuccess,
}: PdfPreviewDocumentProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        loading={
          <div className="flex items-center justify-center p-8">
            <div
              aria-hidden="true"
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            />
          </div>
        }
        error={
          <div className="text-red-500 p-4">
            Failed to load PDF. Please try again.
          </div>
        }
      >
        {numPages
          ? Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={scale}
                className="mb-4 shadow-lg"
                renderTextLayer
                renderAnnotationLayer
              />
            ))
          : null}
      </Document>
    </div>
  );
}
