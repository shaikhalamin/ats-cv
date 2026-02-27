'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
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
  pdfData: string | null; // Base64 encoded PDF
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
    "title": "Senior Fullstack Developer",
    "phone": "+8801712341937",
    "email": "alamin.cse15@gmail.com",
    "location": "Dhaka, Bangladesh"
  },
  "socialLinks": {
    "github": "github.com/shaikhalamin",
    "linkedin": "linkedin.com/in/shaikhalamin",
    "portfolio": "shaikhalamin.dev"
  },
  "professionalSummary": "Forward-thinking and solution-oriented professional with 9+ years in software engineering from startups to enterprise. I specialize in backend systems that scale. Currently building a real-time video consultation platform at tixio.io, where I design microservices handling WebRTC sessions, real-time messaging, and AWS infrastructure.",
  "experience": [
    {
      "company": "Tixio IO",
      "role": "Senior Fullstack Engineer",
      "period": "February 2025 - Present",
      "location": "Dhaka, Bangladesh (Remote)",
      "achievements": [
        "Building a real-time video consultation platform serving users globally across 15+ countries.",
        "Architected WebRTC-based video infrastructure handling 10,000+ daily sessions with 99.9% uptime",
        "Designed microservices backend using NestJS and TypeScript, reducing system latency by 40%",
        "Led technical decisions for AWS infrastructure (EC2, Lambda, RDS), optimizing cloud costs by 25%",
        "Mentored 3 junior developers on best practices, code quality, and system design principles"
      ],
      "techStack": "Node.js, NestJS, TypeScript, WebRTC, PostgreSQL, MongoDB, Redis, AWS, Docker, Prisma"
    },
    {
      "company": "Liberate Labs",
      "role": "Lead Fullstack Developer",
      "period": "April 2024 - January 2025",
      "location": "Dhaka, Bangladesh (Remote)",
      "achievements": [
        "Delivered full-stack solutions for clients across fintech, healthcare, and e-commerce sectors.",
        "Led development of payment processing system handling $2M+ monthly transactions",
        "Reduced deployment time by 60% by implementing CI/CD pipelines with GitHub Actions",
        "Collaborated with product teams to translate business requirements into technical specifications",
        "Conducted code reviews and established coding standards for team of 5 developers"
      ],
      "techStack": "Node.js, Express.js, Nest.js, React.js, PostgreSQL, MongoDB, AWS"
    },
    {
      "company": "Tikweb BD",
      "role": "Senior Software Engineer",
      "period": "March 2023 - April 2024",
      "location": "Dhaka, Bangladesh (Denmark Based)",
      "achievements": [
        "Built and maintained web applications for Scandinavian clients in logistics, education, and SaaS.",
        "Developed real-time dashboard system processing 50,000+ daily events using Socket.io and Redis",
        "Led migration from REST to GraphQL, improving mobile app performance by 30%",
        "Mentored 4 junior developers through code reviews and pair programming sessions",
        "Implemented automated testing strategy, increasing code coverage from 20% to 85%"
      ],
      "techStack": "Node.js, Express.js, Nest.js, TypeORM, React.js, MySQL, GCP"
    },
    {
      "company": "Venturas Ltd",
      "role": "Senior Fullstack Engineer",
      "period": "February 2021 - March 2023",
      "location": "Dhaka, Bangladesh (Japan Based)",
      "achievements": [
        "Built enterprise Property Management System managing land and building assets with GIS mapping and cloud infrastructure.",
        "Architected scalable microservices backend using NestJS and TypeScript, supporting 10,000+ property records with 99.9% uptime",
        "Designed AWS infrastructure (ECS, S3, RDS, VPC) with automated CI/CD pipelines, reducing deployment time by 70%",
        "Implemented Google Maps geo-clustering feature, enabling clients to visualize and manage 5,000+ property locations efficiently",
        "Led team of 3 junior developers through code reviews, sprint planning, and technical mentorship",
        "Built admin dashboards with React and Next.js for real-time data visualization and workflow management"
      ],
      "techStack": "Node.js, Express, TypeScript, Nest.js, React, MySQL, AWS"
    },
    {
      "company": "Wipro Limited",
      "role": "Senior Software Engineer",
      "period": "September 2019 - January 2021",
      "location": "Dhaka, Bangladesh (India-based)",
      "achievements": [
        "Developed enterprise ERP system serving internal business operations across HR, Finance, and Shared Services departments.",
        "Built REST APIs for 4 core ERP modules (Shared Services, iExpense, HR Letter, TMS), supporting 1,000+ daily active users",
        "Optimized database queries and API performance, reducing average response time from 800ms to 200ms",
        "Designed admin dashboards with CakePHP and jQuery, streamlining data management workflows for non-technical users",
        "Managed deployment pipelines on Apache/Linux infrastructure, achieving 99.5% uptime across ERP environments",
        "Mentored 2 junior developers on backend best practices, code quality, and database optimization techniques"
      ],
      "techStack": "CakePHP, REST APIs, PHP, CakePHP, JWT, AWS, jQuery, Apache, Linux, JavaScript"
    },
    {
      "company": "Teamnet",
      "role": "Software Engineer",
      "period": "April 2016 - August 2019",
      "location": "Dhaka, Bangladesh (USA-based)",
      "achievements": [
        "Built Volatour, a travel booking platform handling flights, hotels, and tour packages with third-party API integrations.",
        "Developed REST and SOAP APIs for booking workflows and payment processing, supporting 500+ monthly transactions",
        "Integrated 5+ third-party travel APIs (GDS, payment gateways) for real-time availability and pricing data",
        "Optimized MySQL database queries and schema design, reducing page load times by 60%",
        "Built admin panel for operations team to manage bookings, customers, and vendor relationships",
        "Collaborated with frontend and QA teams to deliver features on 2-week sprint cycles"
      ],
      "techStack": "Laravel, MySQL, SOAP API, REST API, React JS, Digital Ocean"
    }
  ],
  "technicalSkills": [
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
        "Bootstrap"
      ]
    },
    {
      "category": "Database/DBMS",
      "skills": ["MySQL", "PostgreSQL", "Redis", "TypeORM", "Prisma"]
    },
    {
      "category": "Message/Queue",
      "skills": ["Redis-Queue (Bull/MQ)", "PG-Queue", "RabbitMQ"]
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
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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
    setPdfData(null);
    setPdfError(null);
  }, [validateAndUpdateData]);

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

      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      setPdfData(base64);
    } catch (error) {
      console.error('PDF generation error:', error);
      setPdfError(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  }, [cvData]);

  // Download PDF
  const downloadPdf = useCallback(() => {
    if (!pdfData) return;

    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfData}`;
    link.download = `cv-${cvData?.personalDetails.name.replace(/\s+/g, '-') || 'document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfData, cvData]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    setJsonStringState(DEFAULT_CV_JSON);
    validateAndUpdateData(DEFAULT_CV_JSON);
    setPdfData(null);
    setPdfError(null);
  }, [validateAndUpdateData]);

  return (
    <CvContext.Provider
      value={{
        jsonString,
        setJsonString,
        cvData,
        isValid,
        validationErrors,
        pdfData,
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
