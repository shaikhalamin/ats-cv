'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useCv } from '@/lib/context/CvContext';
import Button from './ui/Button';

const PdfPreviewDocument = dynamic(
  () => import('./PdfPreviewDocument'),
  {
    ssr: false,
    loading: () => <PdfLoading />,
  },
);

export default function CvPreview() {
  const { pdfUrl, isGenerating, pdfError, generatePdf, isValid } = useCv();
  const [scale, setScale] = useState(1);
  const [loadedDocument, setLoadedDocument] = useState<{
    pdfUrl: string;
    numPages: number;
  } | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    if (!pdfUrl) return;

    setLoadedDocument({
      pdfUrl,
      numPages,
    });
  }, [pdfUrl]);

  const numPages = loadedDocument?.pdfUrl === pdfUrl ? loadedDocument.numPages : null;

  const zoomIn = useCallback(() => {
    setScale((previousScale) => Math.min(previousScale + 0.25, 2));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((previousScale) => Math.max(previousScale - 0.25, 0.5));
  }, []);

  if (!pdfUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-12 w-12" />
            <p className="text-gray-600 dark:text-gray-400">Generating PDF...</p>
          </div>
        ) : pdfError ? (
          <div className="flex flex-col items-center gap-4 text-red-500">
            <svg
              aria-hidden="true"
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>{pdfError}</p>
            <Button onClick={generatePdf}>Try Again</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
            <svg
              aria-hidden="true"
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Edit the JSON and click &quot;Preview&quot; to see your CV</p>
            <Button onClick={generatePdf} disabled={!isValid} size="lg">
              Preview PDF
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Button
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            variant="secondary"
            size="sm"
            className="h-8 w-8 !p-0"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </Button>
          <span className="text-sm font-medium min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={scale >= 2}
            variant="secondary"
            size="sm"
            className="h-8 w-8 !p-0"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </div>
        {numPages ? (
          <span className="text-sm text-gray-500">
            {numPages} page{numPages > 1 ? 's' : ''}
          </span>
        ) : null}
        <Button
          onClick={generatePdf}
          disabled={!isValid}
          isLoading={isGenerating}
          size="sm"
        >
          {isGenerating ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900 p-4">
        <PdfPreviewDocument
          pdfUrl={pdfUrl}
          numPages={numPages}
          scale={scale}
          onLoadSuccess={onDocumentLoadSuccess}
        />
      </div>
    </div>
  );
}

function PdfLoading() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-gray-500">Loading preview...</p>
      </div>
    </div>
  );
}

function Spinner({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-spin rounded-full border-b-2 border-blue-600 ${className}`}
    />
  );
}
