import { z } from "zod";

// ==============================================================================
// 1. STATUTS ET ÉNUMÉRATIONS ACADÉMIQUES
// ==============================================================================

export const LEARNING_STATUSES = [
  "en_cours",
  "a_reviser",
  "comprise",
  "maitrisee",
] as const;

export type LearningStatus = (typeof LEARNING_STATUSES)[number];

export const CYCLE_TYPES = ["Licence", "Master", "Doctorat"] as const;
export type CycleType = (typeof CYCLE_TYPES)[number];

export const DOC_TYPES = ["cours", "td", "annale", "synthese", "autre"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const VISIBILITY_TYPES = ["private", "institutional"] as const;
export type VisibilityType = (typeof VISIBILITY_TYPES)[number];

export const PROCESSING_STATUSES = ["pending", "processing", "processed", "failed"] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

// ==============================================================================
// 2. TYPES DU MODÈLE RELATIONNEL DE RÉFÉRENCE
// ==============================================================================

export interface Institution {
  id: string;
  name: string;
  type: "university" | "school" | "institute" | "training_center" | "other";
  code: string;
  country: string;
  createdAt: string;
}

export interface AcademicUnit {
  id: string;
  institutionId: string;
  name: string;
  type: "faculty" | "school" | "institute" | "department" | "other";
  code: string;
  createdAt: string;
}

export interface Program {
  id: string;
  academicUnitId: string;
  name: string;
  cycle: CycleType;
  createdAt: string;
}

export interface Track {
  id: string;
  programId: string;
  name: string;
  code: string | null;
  createdAt: string;
}

export interface Semester {
  id: string;
  programId: string;
  semesterNumber: number;
  totalCredits: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  credits: number | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ProgramSubject {
  id: string;
  semesterId: string;
  subjectId: string;
  trackId: string | null;
  displayOrder: number | null;
  isRequired: boolean;
  createdAt: string;
}

export interface StudentProfile {
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  programId: string | null;
  currentTrackId: string | null;
  currentSemesterId: string | null;
  customInstitution: string | null;
  customProgram: string | null;
  customLevel: string | null;
  registrationYear: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubjectProgress {
  id: string;
  userId: string;
  subjectId: string;
  learningStatus: LearningStatus;
  isFlaggedDifficult: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PedagogicalDocument {
  id: string;
  subjectId: string | null;
  uploaderId: string | null;
  title: string;
  storagePath: string;
  docType: DocType;
  isOfficial: boolean;
  visibility: VisibilityType;
  processingStatus: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// 3. SCHÉMAS DE VALIDATION ZOD
// ==============================================================================

export const onboardingSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom est trop long"),
  lastName: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom est trop long"),
  displayName: z
    .string()
    .trim()
    .max(100, "Le nom d'affichage est trop long")
    .optional()
    .nullable(),
  programId: z
    .string()
    .uuid("Identifiant de programme invalide")
    .optional()
    .nullable(),
  trackId: z
    .string()
    .uuid("Identifiant de parcours invalide")
    .optional()
    .nullable(),
  semesterId: z
    .string()
    .uuid("Identifiant de semestre invalide")
    .optional()
    .nullable(),
  registrationYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "L'année académique doit être au format AAAA-AAAA (ex: 2024-2025)")
    .optional()
    .nullable(),
  customInstitution: z.string().trim().max(100).optional().nullable(),
  customProgram: z.string().trim().max(100).optional().nullable(),
  customLevel: z.string().trim().max(50).optional().nullable(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const updateSubjectProgressSchema = z.object({
  subjectId: z.string().uuid("Identifiant de matière invalide"),
  learningStatus: z.enum(LEARNING_STATUSES).optional(),
  isFlaggedDifficult: z.boolean().optional(),
});

export type UpdateSubjectProgressInput = z.infer<typeof updateSubjectProgressSchema>;

// ==============================================================================
// 4. DTO CONTEXTE ACADÉMIQUE POUR L'IA (SERVER-SIDE)
// ==============================================================================

export interface AcademicSubjectContext {
  id: string;
  code: string | null;
  name: string;
  credits: number | null;
  isCustom: boolean;
  learningStatus: LearningStatus;
  isFlaggedDifficult: boolean;
}

export interface AcademicContext {
  student: {
    userId: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    registrationYear: string | null;
  };
  institution: {
    official: {
      institution: {
        id: string;
        name: string;
        type: string;
        code: string;
        country: string;
      } | null;
      academicUnit: {
        id: string;
        name: string;
        type: string;
        code: string;
      } | null;
      program: {
        id: string;
        name: string;
        cycle: CycleType;
      } | null;
      track: {
        id: string;
        name: string;
        code: string | null;
      } | null;
      currentSemester: {
        id: string;
        semesterNumber: number;
        totalCredits: number | null;
      } | null;
    };
    custom: {
      institutionName: string | null;
      programName: string | null;
      levelName: string | null;
    };
  };
  progression: {
    enrolledSubjects: AcademicSubjectContext[];
    difficultSubjects: AcademicSubjectContext[];
    subjectsNeedingReview: AcademicSubjectContext[];
    masteredSubjects: AcademicSubjectContext[];
    metrics: {
      totalSubjects: number;
      difficultCount: number;
      masteredCount: number;
    };
  };
}
