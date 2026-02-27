'use client';

import Button from './ui/Button';
import { useCv } from '@/lib/context/CvContext';

export default function DownloadButton() {
  const { pdfData, cvData, downloadPdf, isGenerating } = useCv();

  return (
    <Button
      onClick={downloadPdf}
      disabled={!pdfData || isGenerating}
      variant="secondary"
      className="flex items-center gap-2"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Download PDF
    </Button>
  );
}
