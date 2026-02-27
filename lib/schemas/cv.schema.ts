import { z } from 'zod';

// Personal Details Schema
export const PersonalDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  location: z.string().min(1, 'Location is required'),
});

// Social Links Schema
export const SocialLinksSchema = z.object({
  github: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
});

// Experience Schema
export const ExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  period: z.string().min(1, 'Period is required'),
  location: z.string().optional(),
  achievements: z.array(z.string().min(1, 'Achievement cannot be empty')).min(1, 'At least one achievement is required'),
  techStack: z.string().optional(),
});

// Technical Skill Schema
export const TechnicalSkillSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  skills: z.array(z.string().min(1, 'Skill cannot be empty')).min(1, 'At least one skill is required'),
});

// Education Schema
export const EducationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.string().min(1, 'Year is required'),
  details: z.string().optional(),
});

// Complete CV Data Schema
export const CVDataSchema = z.object({
  personalDetails: PersonalDetailsSchema,
  socialLinks: SocialLinksSchema,
  professionalSummary: z.string().min(1, 'Professional summary is required'),
  experience: z.array(ExperienceSchema).min(1, 'At least one experience is required'),
  technicalSkills: z.array(TechnicalSkillSchema).min(1, 'At least one skill category is required'),
  education: z.array(EducationSchema).min(1, 'At least one education entry is required'),
});

// Type exports for TypeScript inference
export type PersonalDetails = z.infer<typeof PersonalDetailsSchema>;
export type SocialLinks = z.infer<typeof SocialLinksSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type TechnicalSkill = z.infer<typeof TechnicalSkillSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type CVData = z.infer<typeof CVDataSchema>;

// Validation helper function
export function validateCVData(data: unknown): {
  success: boolean;
  data?: CVData;
  errors?: z.ZodError['issues'];
} {
  const result = CVDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

// Helper to convert character position to line/column
function getPositionInfo(jsonString: string, position: number): { line: number; column: number } {
  const lines = jsonString.substring(0, position).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

// Parse JSON string and validate
export function parseAndValidateCV(jsonString: string): {
  success: boolean;
  data?: CVData;
  errors?: Array<{ path: string; message: string }>;
} {
  try {
    const parsed = JSON.parse(jsonString);
    const result = CVDataSchema.safeParse(parsed);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: result.error.issues.map(err => ({
        path: err.path.join('.') || 'root',
        message: err.message,
      })),
    };
  } catch (error) {
    // Extract position from JSON parse error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const positionMatch = errorMessage.match(/position\s+(\d+)/i);
    const position = positionMatch ? parseInt(positionMatch[1], 10) : null;

    let locationInfo = '';
    if (position !== null) {
      const { line, column } = getPositionInfo(jsonString, position);
      locationInfo = ` at line ${line}, column ${column}`;
    }

    // Clean up the error message for better readability
    const cleanMessage = errorMessage
      .replace(/^JSON\.parse:\s*/i, '')
      .replace(/\s*at position\s+\d+/i, '');

    return {
      success: false,
      errors: [{
        path: locationInfo ? `JSON${locationInfo}` : 'JSON',
        message: cleanMessage || 'Invalid JSON syntax',
      }],
    };
  }
}
