import { z } from "zod";

// ============================================================================
// 1. Core Types & Enums
// ============================================================================

export type AIMode = "explain" | "summarize" | "quiz" | "coach";

export type SourceProvenance = "OFFICIAL" | "STUDENT" | "SYSTEM";
export type GeneratedBy = "AI";

export interface ProvenanceTag {
  type: SourceProvenance;
  label: string;
}

export interface UIAction {
  label: string;
  actionType: "NAVIGATE" | "RETRY" | "OTHER";
  payload?: Record<string, unknown>;
}

// ============================================================================
// 2. Context Types
// ============================================================================

export type LearnerMemoryCategory = "preference" | "goal" | "difficulty" | "fact";
export type LearnerMemorySourceType = "conversation" | "activity" | "exercise" | "revision" | "document";

export interface LearnerMemory {
  id: string;
  user_id: string;
  category: LearnerMemoryCategory;
  content: string;
  source_type: LearnerMemorySourceType;
  source_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export interface AIStudentContext {
  // NO PII! No name, no email, no uuid.
  semester?: string;
  program?: string;
  level?: string;
}

export interface AIAcademicContext {
  subjectId?: string;
  subjectName?: string;
  subjectDescription?: string;
}

export interface AILearningContextSummary {
  recentActivities: string[]; // Max 5
  recentErrors: string[]; // Max 5
}

export interface AICurrentState {
  path?: string;
  exerciseId?: string;
  questionId?: string;
  blockingQuestion?: string;
}

/**
 * Internal backend representation of a Source Document
 */
export interface InternalSourceDocument {
  source_id: string; // Database internal UUID (NEVER SENT TO PROVIDER)
  content: string;
  provenance: SourceProvenance;
}

/**
 * Backend-only mapping entry for REF→provenance validation.
 * Mirrors the fields of RetrievedChunk needed by OpenAIProvider
 * without creating a circular dependency with the RAG module.
 */
export interface InternalChunkMapping {
  ref: string;
  documentId: string;
  chunkId: string;
  content: string;
  similarity: number;
  pageNumber: number | null;
  provenance: SourceProvenance;
  metadata: Record<string, unknown> | null;
}

/**
 * Provider-safe representation of a Source Document
 */
export interface ProviderSourceDocument {
  ref?: string; // The REF_X identifier
  sourceLabel: string; // e.g. "Document 1" (Safe to send)
  content: string;
  provenance: SourceProvenance;
}

// ============================================================================
// 3. AI Contracts
// ============================================================================

export interface AIRequest {
  mode: AIMode;
  studentContext: AIStudentContext;
  academicContext?: AIAcademicContext;
  learningContext?: AILearningContextSummary;
  sourceContext?: ProviderSourceDocument[]; // ONLY the safe DTO
  currentContext?: AICurrentState;
  userMessage: string;
  summary?: string; // M10.7: Conversation summary
  learnerMemories?: LearnerMemory[]; // M10.7: UNTRUSTED DATA
  recentHistory?: { role: string; content: string }[]; // M10.7: UNTRUSTED DATA
  _internalMapping?: Record<string, InternalChunkMapping>; // Backend-only mapping for REF validation
}

export interface AIResponse {
  message: string;
  mode: AIMode;
  generatedBy: GeneratedBy; // ALWAYS 'AI'
  sourceProvenance: ProvenanceTag[]; // Only if an OFFICIAL, SYSTEM, or STUDENT source was used
  suggestedActions?: UIAction[];
  warnings?: string[];
}

export interface AIProvider {
  generate(request: AIRequest, signal?: AbortSignal): Promise<AIResponse>;
  stream(request: AIRequest, signal?: AbortSignal): AsyncIterable<Partial<AIResponse>>;
}

// ============================================================================
// 4. Zod Schemas for Validation
// ============================================================================

export const LearnerMemoryCategorySchema = z.enum(["preference", "goal", "difficulty", "fact"]);
export const LearnerMemorySourceTypeSchema = z.enum(["conversation", "activity", "exercise", "revision", "document"]);

export const LearnerMemorySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category: LearnerMemoryCategorySchema,
  content: z.string(),
  source_type: LearnerMemorySourceTypeSchema,
  source_id: z.string().uuid().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});


export const AIModeSchema = z.enum(["explain", "summarize", "quiz", "coach"]);

export const AIStudentContextSchema = z.object({
  semester: z.string().optional(),
  program: z.string().optional(),
  level: z.string().optional(),
  // Strict refusal of PII:
  id: z.never().optional(),
  name: z.never().optional(),
  email: z.never().optional(),
});

export const AIAcademicContextSchema = z.object({
  subjectId: z.string().uuid().optional(),
  subjectName: z.string().optional(),
  subjectDescription: z.string().optional(),
});

export const AILearningContextSummarySchema = z.object({
  recentActivities: z.array(z.string()).max(5),
  recentErrors: z.array(z.string()).max(5),
});

export const AICurrentStateSchema = z.object({
  path: z.string().optional(),
  exerciseId: z.string().optional(),
  questionId: z.string().optional(),
  blockingQuestion: z.string().optional(),
});

export const SourceProvenanceSchema = z.enum(["OFFICIAL", "STUDENT", "SYSTEM"]);

export const ProviderSourceDocumentSchema = z.object({
  ref: z.string().optional(),
  sourceLabel: z.string(),
  content: z.string(),
  provenance: SourceProvenanceSchema,
});

export const AIRequestSchema = z.object({
  mode: AIModeSchema,
  studentContext: AIStudentContextSchema,
  academicContext: AIAcademicContextSchema.optional(),
  learningContext: AILearningContextSummarySchema.optional(),
  sourceContext: z.array(ProviderSourceDocumentSchema).optional(),
  currentContext: AICurrentStateSchema.optional(),
  userMessage: z.string(),
  summary: z.string().optional(),
  learnerMemories: z.array(LearnerMemorySchema).optional(),
  recentHistory: z.array(z.object({
    role: z.string(),
    content: z.string()
  })).optional(),
  _internalMapping: z.record(z.any()).optional(), // We use any in Zod to avoid duplicating the InternalSourceDocument schema here, but the type is strong in AIRequest
});

export const ProvenanceTagSchema = z.object({
  type: SourceProvenanceSchema,
  label: z.string(),
});

export const UIActionSchema = z.object({
  label: z.string(),
  actionType: z.enum(["NAVIGATE", "RETRY", "OTHER"]),
  payload: z.record(z.unknown()).optional(),
});

export const AIResponseSchema = z.object({
  message: z.string(),
  mode: AIModeSchema,
  generatedBy: z.literal("AI"),
  sourceProvenance: z.array(ProvenanceTagSchema),
  suggestedActions: z.array(UIActionSchema).optional(),
  warnings: z.array(z.string()).optional(),
});

// ============================================================================
// 5. Standardized Errors
// ============================================================================

export type AIErrorCode = 
  | "PROVIDER_UNAVAILABLE"
  | "CONTEXT_TOO_LARGE"
  | "RATE_LIMIT_EXCEEDED"
  | "UNSAFE_CONTENT"
  | "INTERNAL_ERROR";

export class AIError extends Error {
  constructor(public code: AIErrorCode, message: string) {
    super(message);
    this.name = "AIError";
  }
}
