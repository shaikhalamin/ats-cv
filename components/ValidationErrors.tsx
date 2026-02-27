'use client';

import { useState } from 'react';

interface ValidationError {
  path: string;
  message: string;
}

interface ValidationErrorsProps {
  errors: ValidationError[];
}

export default function ValidationErrors({ errors }: ValidationErrorsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-red-500"
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
          <span className="font-medium text-red-700 dark:text-red-400">
            {errors.length} validation error{errors.length > 1 ? 's' : ''}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-red-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3">
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li
                key={index}
                className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"
              >
                <span className="font-mono text-xs bg-red-100 dark:bg-red-800 px-1.5 py-0.5 rounded shrink-0">
                  {error.path}
                </span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
