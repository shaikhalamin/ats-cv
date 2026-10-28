'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DownloadButton from '@/components/DownloadButton';
import Button from '@/components/ui/Button';
import { useCv } from '@/lib/context/CvContext';

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
  const [loadedDocument, setLoadedDocument] = useState<{
    pdfUrl: string;
    numPages: number;
  } | null>(null);

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
      <header className="sticky top-0 z-10 flex items-center justify-end gap-4 px-4 sm:px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Link
          href="/settings"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          Settings
        </Link>
        <DownloadButton />
      </header>

      <main className="flex-1 py-6">
        {pdfUrl ? (
          <PdfPreviewDocument
            pdfUrl={pdfUrl}
            numPages={numPages}
            scale={scale}
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
    <div className="flex justify-center pt-24">
      <div
        aria-hidden="true"
        className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"
      />
    </div>
  );
}
