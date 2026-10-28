'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { parseAndValidateCV } from '@/lib/schemas/cv.schema';
import type { CVData } from '@/lib/schemas/cv.schema';
import { DEFAULT_CV_JSON, DEFAULT_PDF_URL, DEFAULT_RENDER_OPTIONS } from '@/lib/defaultCv';

interface ValidationError {
  path: string;
  message: string;
}

interface CvContextType {
  // JSON state
  jsonString: string;
  setJsonString: (value: string) => void;

  // Parsed data
  cvData: CVData | null;

  // Validation state
  isValid: boolean;
  validationErrors: ValidationError[];

  // PDF state
  pdfUrl: string | null;
  isGenerating: boolean;
  pdfError: string | null;

  // Render settings
  placeTechnicalSkillsAfterSummary: boolean;
  setPlaceTechnicalSkillsAfterSummary: (value: boolean) => void;
  includeProjectShowcase: boolean;
  setIncludeProjectShowcase: (value: boolean) => void;

  // Actions
  generatePdf: () => Promise<void>;
  downloadPdf: () => void;
  resetToDefault: () => void;
}

const CvContext = createContext<CvContextType | null>(null);

export function CvProvider({ children }: { children: ReactNode }) {
  // JSON state
  const [jsonString, setJsonStringState] = useState(DEFAULT_CV_JSON);

  // Parsed and validated data
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // PDF state - starts on the prerendered default CV, replaced by a blob URL once regenerated
  const [pdfUrl, setPdfUrl] = useState<string | null>(DEFAULT_PDF_URL);
  const pdfUrlRef = useRef<string | null>(DEFAULT_PDF_URL);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Render settings
  const [placeTechnicalSkillsAfterSummary, setPlaceTechnicalSkillsAfterSummaryState] = useState(
    DEFAULT_RENDER_OPTIONS.placeTechnicalSkillsAfterSummary,
  );
  const [includeProjectShowcase, setIncludeProjectShowcaseState] = useState(
    DEFAULT_RENDER_OPTIONS.includeProjectShowcase,
  );

  const setPdfObjectUrl = useCallback((nextPdfUrl: string | null) => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
    }

    pdfUrlRef.current = nextPdfUrl;
    setPdfUrl(nextPdfUrl);
  }, []);

  const setPlaceTechnicalSkillsAfterSummary = useCallback((value: boolean) => {
    setPlaceTechnicalSkillsAfterSummaryState(value);
    setPdfObjectUrl(null);
    setPdfError(null);
  }, [setPdfObjectUrl]);

  const setIncludeProjectShowcase = useCallback((value: boolean) => {
    setIncludeProjectShowcaseState(value);
    setPdfObjectUrl(null);
    setPdfError(null);
  }, [setPdfObjectUrl]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  // Validate JSON on change
  const validateAndUpdateData = useCallback((json: string) => {
    const result = parseAndValidateCV(json);

    if (result.success && result.data) {
      setCvData(result.data);
      setIsValid(true);
      setValidationErrors([]);
    } else {
      setCvData(null);
      setIsValid(false);
      setValidationErrors(result.errors || []);
    }
  }, []);

  // Set JSON string and validate
  const setJsonString = useCallback((value: string) => {
    setJsonStringState(value);
    validateAndUpdateData(value);
    // Clear PDF when JSON changes
    setPdfObjectUrl(null);
    setPdfError(null);
  }, [setPdfObjectUrl, validateAndUpdateData]);

  // Initial validation on mount
  useEffect(() => {
    validateAndUpdateData(jsonString);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate PDF via API
  const generatePdf = useCallback(async () => {
    // Skip if a request is already in flight
    if (!cvData || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setPdfError(null);

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvData,
          options: {
            placeTechnicalSkillsAfterSummary,
            includeProjectShowcase,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      const pdfBlob = await response.blob();
      setPdfObjectUrl(URL.createObjectURL(pdfBlob));
    } catch (error) {
      console.error('PDF generation error:', error);
      setPdfError(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [cvData, placeTechnicalSkillsAfterSummary, includeProjectShowcase, setPdfObjectUrl]);

  // Download PDF
  const downloadPdf = useCallback(() => {
    if (!pdfUrl) return;

    const title = cvData?.personalDetails.title.replace(/\s+/g, '') || '';
    const name = cvData?.personalDetails.name.replace(/\s+/g, '') || 'document';
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}_${name}_cv.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, cvData]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    setJsonStringState(DEFAULT_CV_JSON);
    validateAndUpdateData(DEFAULT_CV_JSON);
    setPlaceTechnicalSkillsAfterSummaryState(DEFAULT_RENDER_OPTIONS.placeTechnicalSkillsAfterSummary);
    setIncludeProjectShowcaseState(DEFAULT_RENDER_OPTIONS.includeProjectShowcase);
    setPdfObjectUrl(DEFAULT_PDF_URL);
    setPdfError(null);
  }, [setPdfObjectUrl, validateAndUpdateData]);

  return (
    <CvContext.Provider
      value={{
        jsonString,
        setJsonString,
        cvData,
        isValid,
        validationErrors,
        pdfUrl,
        isGenerating,
        pdfError,
        placeTechnicalSkillsAfterSummary,
        setPlaceTechnicalSkillsAfterSummary,
        includeProjectShowcase,
        setIncludeProjectShowcase,
        generatePdf,
        downloadPdf,
        resetToDefault,
      }}
    >
      {children}
    </CvContext.Provider>
  );
}

export function useCv() {
  const context = useContext(CvContext);
  if (!context) {
    throw new Error('useCv must be used within a CvProvider');
  }
  return context;
}
