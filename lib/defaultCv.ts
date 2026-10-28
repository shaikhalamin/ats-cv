import type { PDFGenerationOptions } from '@/lib/pdf/generator';

// Default CV data as JSON string
export const DEFAULT_CV_JSON = `{
  "personalDetails": {
    "name": "Shaikh Al Amin",
    "title": "Senior Fullstack Engineer",
    "phone": "+8801712341937",
    "email": "alamin.cse15@gmail.com",
    "location": "Dhaka, Bangladesh",
    "photo": "/cv-photo.jpg"
  },
  "socialLinks": {
    "github": "github.com/shaikhalamin",
    "linkedin": "linkedin.com/in/shaikh-al-amin"
  },
  "professionalSummary": "Results-driven Software Engineering professional with 10 years of experience managing the full software development lifecycle, including requirements analysis, system design, development, testing, deployment, and production delivery of scalable software solutions.",
  "experience": [
    {
      "company": "Tixio IO",
      "role": "Senior Fullstack Engineer",
      "period": "February 2025 - Present",
      "location": "Dhaka, Bangladesh",
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
      "location": "Dhaka, Bangladesh",
      "achievements": [
        "Led three cross-functional teams delivering SaaS products across e-commerce, legal tech (NDA platform), and education (LMS) — owning technical architecture and client communication.",
        "Architected rest APIs using NestJS and TypeScript with PostgreSQL and MongoDB, implementing JWT authentication, RBAC, and multi-tenant data isolation.",
        "Managed AWS infrastructure (EC2, RDS, S3) with CI/CD pipelines, and mentored developers through code reviews and pair programming."
      ],
      "techStack": "Node.js, NestJS, Express.js, TypeScript, React, PostgreSQL, MongoDB, AWS, JWT, CI/CD"
    },
    {
      "company": "Tikweb BD",
      "role": "Senior Software Engineer",
      "period": "March 2023 - April 2024",
      "location": "Dhaka, Bangladesh",
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
      "location": "Dhaka, Bangladesh",
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
      "location": "Dhaka, Bangladesh",
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
      "location": "Dhaka, Bangladesh",
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
    },
    {
      "category": "AI/LLM",
      "skills": ["Codex", "Claude", "ChatGPT"]
    }
  ],
  "projects": [
    {
      "name": "Morning Bakery",
      "link": "https://morning-bakery.vercel.app/",
      "description": "Morning Bakery is an e-commerce web application for selling bakery items.",
      "tools": ["PHP", "Laravel", "MySQL", "Next.js", "TypeScript", "Next Auth", "Docker"]
    },
    {
      "name": "Property Finder",
      "link": "https://property-finder-teal.vercel.app/",
      "description": "Property Finder is a web app for renting and selling properties.",
      "tools": ["Node.js", "NestJS", "TypeScript", "TypeORM", "Postgres", "Next.js", "Authentication", "Docker"]
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

// Render settings used by the editor on load/reset and by the prerendered /cv.pdf
export const DEFAULT_RENDER_OPTIONS: Required<PDFGenerationOptions> = {
  placeTechnicalSkillsAfterSummary: true,
  includeProjectShowcase: false,
};

// The default CV, prerendered at build time by app/cv.pdf/route.ts
export const DEFAULT_PDF_URL = '/cv.pdf';
