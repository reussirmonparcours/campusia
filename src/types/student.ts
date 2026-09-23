import { z } from "zod";

// ==============================================================================
// 1. STATUTS ET ÉNUMÉRATIONS ÉTUDIANT
// ==============================================================================

export const OBJECTIVE_TYPES = [
  "subject",
  "revision",
  "progression",
  "general"
] as const;
export type ObjectiveType = (typeof OBJECTIVE_TYPES)[number];

export const OBJECTIVE_STATUSES = [
  "in_progress",
  "achieved",
  "cancelled"
] as const;
export type ObjectiveStatus = (typeof OBJECTIVE_STATUSES)[number];

export const ACTIVITY_PROVENANCES = [
  "manual",
  "system",
  "ai"
] as const;
export type ActivityProvenance = (typeof ACTIVITY_PROVENANCES)[number];

// ==============================================================================
// 2. TYPES DU MODÈLE RELATIONNEL M03
// ==============================================================================

export interface StudentObjective {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  objectiveType: ObjectiveType;
  status: ObjectiveStatus;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentActivity {
  id: string;
  userId: string;
  subjectId: string | null;
  activityType: string;
  description: string;
  provenance: ActivityProvenance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: Record<string, any> | null;
  createdAt: string;
}

// ==============================================================================
// 3. SCHÉMAS DE VALIDATION ZOD
// ==============================================================================

export const createObjectiveSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(100, "Le titre est trop long"),
  objectiveType: z.enum(OBJECTIVE_TYPES),
  subjectId: z
    .string()
    .uuid("Identifiant de matière invalide")
    .optional()
    .nullable(),
  targetDate: z.string().optional().nullable(),
});

export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;

export const updateObjectiveStatusSchema = z.object({
  id: z.string().uuid("Identifiant invalide"),
  status: z.enum(OBJECTIVE_STATUSES),
});

export type UpdateObjectiveStatusInput = z.infer<typeof updateObjectiveStatusSchema>;
