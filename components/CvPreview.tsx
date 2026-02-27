'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCv } from '@/lib/context/CvContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Dynamically import react-pdf components with SSR disabled
const Document = dynamic(
  () => import('react-pdf').then(mod => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then(mod => mod.Page),
  { ssr: false }
);

export default function CvPreview() {
  const { pdfData, isGenerating, pdfError, generatePdf, isValid } = useCv();
  const [scale, setScale] = useState(1.0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Dynamically configure PDF.js worker on client side
    import('react-pdf').then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      setPdfjsLoaded(true);
    });
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  // Show placeholder when no PDF
  if (!pdfData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Generating PDF...</p>
          </div>
        ) : pdfError ? (
          <div className="flex flex-col items-center gap-4 text-red-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>{pdfError}</p>
            <button
              onClick={generatePdf}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Edit the JSON and click &quot;Preview&quot; to see your CV</p>
            <button
              onClick={generatePdf}
              disabled={!isValid}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Preview PDF
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!mounted || !pdfjsLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Zoom controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm font-medium min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {numPages && (
          <span className="text-sm text-gray-500">
            {numPages} page{numPages > 1 ? 's' : ''}
          </span>
        )}
        <button
          onClick={generatePdf}
          disabled={isGenerating || !isValid}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* PDF display */}
      <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 p-4">
        <div className="flex flex-col items-center gap-4">
          <Document
            file={`data:application/pdf;base64,${pdfData}`}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }
            error={
              <div className="text-red-500 p-4">
                Failed to load PDF. Please try again.
              </div>
            }
          >
            {Array.from(new Array(numPages || 1), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={scale}
                className="mb-4 shadow-lg"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
