'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { parseAndValidateCV } from '@/lib/schemas/cv.schema';
import type { CVData } from '@/lib/schemas/cv.schema';

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

  // Actions
  generatePdf: () => Promise<void>;
  downloadPdf: () => void;
  resetToDefault: () => void;
}

const CvContext = createContext<CvContextType | null>(null);

// Default CV data as JSON string
const DEFAULT_CV_JSON = `{
  "personalDetails": {
    "name": "Shaikh Al Amin",
    "title": "Lead Fullstack Engineer",
    "phone": "+8801712341937",
    "email": "alamin.cse15@gmail.com",
    "location": "Dhaka, Bangladesh",
    "photo": "/cv-photo.jpg"
  },
  "socialLinks": {
    "github": "github.com/shaikhalamin",
    "linkedin": "linkedin.com/in/shaikh-al-amin",
    "portfolio": "shaikhalamin.dev"
  },
  "professionalSummary": "Solution architect and backend specialist with 9+ years building scalable distributed systems. I design event-driven microservices architectures using RabbitMQ, NATS, and Redis, transforming monolithic applications into resilient, decoupled systems. Currently architecting an all-in-one business platform at Tixio, decomposing HR, Payroll, CRM, and WebRTC video consultation into independently deployable services with robust message-driven communication patterns.",
  "experience": [
    {
      "company": "Tixio IO",
      "role": "Senior Fullstack Engineer",
      "period": "February 2025 - Present",
      "location": "Dhaka, Bangladesh (Remote)",
      "achievements": [
        "Lead backend development for Vadio (real-time video consultation) and the HR & CRM platform — designing RESTful APIs, WebSocket integrations, and session management with NestJS, MongoDB, and Prisma ORM.",
        "Design event-driven microservice communication using NATS messaging and BullMQ job queues for async processing (notifications, reporting, data sync) across independently deployable services.",
        "Build React-based admin portals for Vadio dashboard and HR/CRM management interfaces with role-based access control.",
        "Mentor junior developers through code reviews, architectural guidance, and sprint planning."
      ],
      "techStack": "Node.js, NestJS, TypeScript, React, PostgreSQL, MongoDB, Prisma, NATS, BullMQ, Stripe, AWS, GCP"
    },
    {
      "company": "Liberate Labs",
      "role": "Lead Fullstack Developer",
      "period": "April 2024 - January 2025",
      "location": "Dhaka, Bangladesh (Remote)",
      "achievements": [
        "Led three cross-functional teams delivering SaaS products across e-commerce, legal tech (NDA platform), and education (LMS) — owning technical architecture and client communication.",
        "Architected domain-driven APIs using NestJS and TypeScript with PostgreSQL and MongoDB, implementing JWT authentication, RBAC, and multi-tenant data isolation.",
        "Managed AWS infrastructure (EC2, RDS, S3) with CI/CD pipelines, and mentored developers through code reviews and pair programming."
      ],
      "techStack": "Node.js, NestJS, Express.js, TypeScript, React, PostgreSQL, MongoDB, AWS, JWT, CI/CD"
    },
    {
      "company": "Tikweb BD",
      "role": "Senior Software Engineer",
      "period": "March 2023 - April 2024",
      "location": "Dhaka, Bangladesh (Denmark Based)",
      "achievements": [
        "Owned backend development for consumer-facing Photo and Planner applications — building REST APIs with NestJS, TypeORM, and MySQL for image processing, subscriptions, and user management.",
        "Designed multi-queue architectures (Firebase Cloud Messaging, Redis-Queue) for background job processing including push notifications and data synchronization.",
        "Built React admin dashboard and managed Jira-based sprint workflows; deployed on GCP with containerized environments."
      ],
      "techStack": "Node.js, NestJS, TypeScript, TypeORM, React, MySQL, Redis-Queue, Firebase, GCP"
    },
    {
      "company": "Venturas Ltd",
      "role": "Senior Fullstack Engineer",
      "period": "February 2021 - March 2023",
      "location": "Dhaka, Bangladesh (Japan Based)",
      "achievements": [
        "Architected RESTful microservice APIs using NestJS and TypeScript for a Property Management Application — handling property listings, tenant management, lease tracking, and payment workflows.",
        "Developed React admin portal for property managers and managed AWS infrastructure (EC2, RDS, S3) with CI/CD pipelines.",
        "Led code reviews, Jira-based project management, and mentored junior developers through technical interviews and onboarding."
      ],
      "techStack": "Node.js, NestJS, TypeScript, React, MySQL, AWS (EC2, RDS, S3), Microservices"
    },
    {
      "company": "Wipro Limited",
      "role": "Senior Software Engineer",
      "period": "September 2019 - January 2021",
      "location": "Dhaka, Bangladesh (India Based)",
      "achievements": [
        "Built and maintained ERP modules (IExpense, Shared Service, TMS) with CakePHP and MySQL — developing RESTful APIs with JWT authentication and role-based access control for web and mobile clients.",
        "Optimized SQL queries for high-volume transactional data and deployed applications on AWS infrastructure across multi-geography Agile teams."
      ],
      "techStack": "PHP, CakePHP, MySQL, REST API, JWT, jQuery, AWS"
    },
    {
      "company": "Teamnet",
      "role": "Software Engineer",
      "period": "April 2016 - August 2019",
      "location": "Dhaka, Bangladesh (USA Based)",
      "achievements": [
        "Built Volatour travel booking platform using Laravel and MySQL — integrating SOAP and REST APIs from third-party providers for flights, hotels, and payment processing pipelines.",
        "Developed RESTful APIs and React admin portal for booking management; deployed on DigitalOcean with server configuration and database administration."
      ],
      "techStack": "Laravel, PHP, MySQL, SOAP API, REST API, React JS, jQuery, DigitalOcean"
    }
  ],
  "technicalSkills": [
    {
      "category": "Architecture & Messaging",
      "skills": [
        "Microservices",
        "Event-Driven Architecture",
        "RabbitMQ",
        "BullMQ",
        "NATS",
        "Redis Pub/Sub"
      ]
    },
    {
      "category": "Programming/Web",
      "skills": [
        "OOP",
        "Node.js",
        "Express",
        "TypeScript",
        "NestJS",
        "React",
        "Next.js",
        "REST",
        "JWT",
        "HTML",
        "CSS",
        "Tailwind"
      ]
    },
    {
      "category": "Database/DBMS",
      "skills": ["MySQL", "PostgreSQL", "Redis", "TypeORM", "Prisma"]
    },
    {
      "category": "SDLC Methodology",
      "skills": ["Agile-Scrum (Jira, Confluence)"]
    },
    {
      "category": "Version Control",
      "skills": ["Git", "BitBucket"]
    },
    {
      "category": "Cloud Platform/VM",
      "skills": ["AWS", "GCP", "VPC", "EC2", "EB", "RDS", "S3", "Docker"]
    }
  ],
  "education": [
    {
      "degree": "BSc in Computer Science and Engineering",
      "institution": "GSTU, Gopalganj",
      "year": "2015",
      "details": "November 2011 - December 2015"
    }
  ]
}`;

export function CvProvider({ children }: { children: ReactNode }) {
  // JSON state
  const [jsonString, setJsonStringState] = useState(DEFAULT_CV_JSON);

  // Parsed and validated data
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // PDF state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const setPdfObjectUrl = useCallback((nextPdfUrl: string | null) => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
    }

    pdfUrlRef.current = nextPdfUrl;
    setPdfUrl(nextPdfUrl);
  }, []);

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
    if (!cvData) return;

    setIsGenerating(true);
    setPdfError(null);

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cvData),
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
      setIsGenerating(false);
    }
  }, [cvData, setPdfObjectUrl]);

  // Auto-generate PDF preview on first load
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && cvData && isValid) {
      setHasInitialized(true);
      generatePdf();
    }
  }, [hasInitialized, cvData, isValid, generatePdf]);

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
    setPdfObjectUrl(null);
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
