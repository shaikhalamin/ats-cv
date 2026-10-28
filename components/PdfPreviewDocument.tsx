'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Load the worker (the largest pdf.js file) from jsDelivr, which is much faster than the
// app's host for some regions; pdfjs.version keeps it in lockstep with the installed pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PdfPreviewDocumentProps {
  pdfUrl: string;
  numPages: number | null;
  scale: number;
  devicePixelRatio?: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
}

export default function PdfPreviewDocument({
  pdfUrl,
  numPages,
  scale,
  devicePixelRatio,
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
                devicePixelRatio={devicePixelRatio}
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
