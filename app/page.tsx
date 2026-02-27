'use client';

import JsonEditor from '@/components/JsonEditor';
import CvPreview from '@/components/CvPreview';
import ValidationErrors from '@/components/ValidationErrors';
import DownloadButton from '@/components/DownloadButton';
import Button from '@/components/ui/Button';
import { useCv } from '@/lib/context/CvContext';
import { useState } from 'react';

export default function Home() {
  const { isValid, isGenerating, generatePdf, resetToDefault, validationErrors } = useCv();
  const [showErrors, setShowErrors] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 text-blue-600"
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            ATS CV Generator
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={generatePdf}
            disabled={!isValid || isGenerating}
            isLoading={isGenerating}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview
          </Button>
          <DownloadButton />
          <Button onClick={resetToDefault} variant="secondary">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </Button>
        </div>
      </header>

      {/* Main content - Split view */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left panel - JSON Editor */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              CV Data (JSON)
            </span>
            {!isValid && (
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                {showErrors ? 'Hide Errors' : `Show ${validationErrors.length} Errors`}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <JsonEditor />
          </div>
        </div>

        {/* Right panel - PDF Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              CV Preview
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CvPreview />
          </div>
        </div>
      </main>

      {/* Validation Errors Panel */}
      {showErrors && !isValid && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
          <ValidationErrors errors={validationErrors} />
        </div>
      )}
    </div>
  );
}
