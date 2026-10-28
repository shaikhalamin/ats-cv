'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { preload } from 'react-dom';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DownloadButton from '@/components/DownloadButton';
import Button from '@/components/ui/Button';
import { useCv } from '@/lib/context/CvContext';
import { DEFAULT_PDF_URL } from '@/lib/defaultCv';

const PdfPreviewDocument = dynamic(
  () => import('@/components/PdfPreviewDocument'),
  {
    ssr: false,
    loading: () => <Spinner />,
  },
);

// A4 page width in PDF points; react-pdf renders 1pt as 1px at scale 1
const A4_WIDTH = 595.28;
const MAX_SCALE = 1.25;
const PAGE_GUTTER = 32;

function subscribeToResize(callback: () => void) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

export default function Home() {
  const { pdfUrl, isGenerating, pdfError, generatePdf, isValid } = useCv();
  const viewportWidth = useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth,
    () => A4_WIDTH,
  );
  const scale = Math.min(MAX_SCALE, (viewportWidth - PAGE_GUTTER) / A4_WIDTH);
  const screenPixelRatio = useSyncExternalStore(
    subscribeToResize,
    () => window.devicePixelRatio,
    () => 1,
  );
  // On narrow screens the page is shrunk to fit; render at full PDF resolution anyway
  // so pinch-zooming up to 100% stays sharp
  const devicePixelRatio = screenPixelRatio * Math.max(1, 1 / scale);
  const [loadedDocument, setLoadedDocument] = useState<{
    pdfUrl: string;
    numPages: number;
  } | null>(null);

  // pdf.js only requests the PDF after its worker starts, and only loads the worker after
  // the viewer chunk, so start both downloads early instead of one after the other
  preload(DEFAULT_PDF_URL, { as: 'fetch', crossOrigin: 'anonymous' });
  useEffect(() => {
    fetch(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)).catch(() => {});
  }, []);

  // Edits made on the Settings page clear the PDF; regenerate it when shown here
  useEffect(() => {
    if (!pdfUrl && isValid && !isGenerating && !pdfError) {
      generatePdf();
    }
  }, [pdfUrl, isValid, isGenerating, pdfError, generatePdf]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    if (!pdfUrl) return;

    setLoadedDocument({
      pdfUrl,
      numPages,
    });
  }, [pdfUrl]);

  const numPages = loadedDocument?.pdfUrl === pdfUrl ? loadedDocument.numPages : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-200 dark:bg-gray-950">
      <header className="sm:sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 min-w-0">
          <svg
            aria-hidden="true"
            className="w-8 h-8 flex-shrink-0 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold leading-tight text-gray-900 dark:text-white">
              Curriculum Vitae
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Shaikh Al Amin CV. Read it below or download the PDF.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Settings
          </Link>
          <DownloadButton />
        </div>
      </header>

      <main className="flex-1 py-6">
        {pdfUrl ? (
          <PdfPreviewDocument
            pdfUrl={pdfUrl}
            numPages={numPages}
            scale={scale}
            devicePixelRatio={devicePixelRatio}
            onLoadSuccess={onDocumentLoadSuccess}
          />
        ) : !isValid ? (
          <div className="flex flex-col items-center gap-4 pt-24 text-gray-600 dark:text-gray-400">
            <p>The CV data has validation errors.</p>
            <Link href="/settings" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Fix it in Settings
            </Link>
          </div>
        ) : pdfError ? (
          <div className="flex flex-col items-center gap-4 pt-24 text-red-500">
            <p>{pdfError}</p>
            <Button onClick={generatePdf}>Try Again</Button>
          </div>
        ) : (
          <Spinner />
        )}
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 pt-24 text-gray-600 dark:text-gray-400">
      <div
        aria-hidden="true"
        className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
      />
      <p>Loading CV...</p>
    </div>
  );
}
