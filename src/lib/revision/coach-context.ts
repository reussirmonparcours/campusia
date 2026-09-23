import { ProviderSourceDocument } from "@/types/ai";

export interface RevisionCoachContext {
  subjectName: string;
  exerciseTitle: string;
  questionContent: string;
  studentAnswer: string;
  expectedAnswer?: string | null;
  evaluationStatus: 'incorrect' | 'unanswered';
}

/**
 * Type representing internal M04 learning attempt data needed to build the context.
 * We avoid passing raw Supabase objects or full rows to enforce the trust boundary.
 */
export interface InternalLearningAttemptData {
  status: string; // From learning_attempts
  score: number | null;
  max_score: number | null;
  learning_exercise: {
    title: string;
    subject: {
      name: string;
    } | null;
  } | null;
  // To keep it simple for the MVP, we assume a single question context for the revision coach,
  // or we aggregate the answers. For a strict pedagogical model, we extract the first incorrect/unanswered answer.
  answers: {
    is_correct: boolean | null;
    free_text_answer: string | null;
    choice: {
      content: string;
      is_correct: boolean;
    } | null;
    question: {
      question_type: string;
      content: string;
      explanation: string | null;
      choices: {
        content: string;
        is_correct: boolean;
      }[];
    } | null;
  }[];
}

/**
 * Builds a purified RevisionCoachContext from internal M04 data.
 * Guarantees that no UUID, user_id, or PII crosses the boundary.
 */
export function buildRevisionCoachContext(data: InternalLearningAttemptData): RevisionCoachContext {
  // Extract subject and exercise info safely
  const subjectName = data.learning_exercise?.subject?.name || "Matière inconnue";
  const exerciseTitle = data.learning_exercise?.title || "Exercice";

  // Find the first relevant incorrect or unanswered answer to coach on
  const targetAnswer = data.answers.find(a => !a.is_correct) || data.answers[0];

  if (!targetAnswer) {
    throw new Error("No answers available to build coaching context");
  }

  const questionContent = targetAnswer.question?.content || "Contenu de la question introuvable";
  
  // Extract student answer based on question type
  let studentAnswer = "";
  if (targetAnswer.question?.question_type === 'free_text') {
    studentAnswer = targetAnswer.free_text_answer || "";
  } else if (targetAnswer.choice) {
    studentAnswer = targetAnswer.choice.content;
  }

  // Extract expected answer based on question type
  let expectedAnswer: string | null | undefined = undefined;
  if (targetAnswer.question?.question_type === 'free_text') {
    // For free text, M04 'explanation' is just pedagogical, not a strict 'expected answer' 
    // to be presented as official correction unless it's explicitly modeled as such.
    // In current M04 schema, there is no strict expected answer for free text.
    expectedAnswer = null;
  } else {
    // Choice question: the reliable correction is the correct choice(s)
    const correctChoices = targetAnswer.question?.choices?.filter(c => c.is_correct) || [];
    if (correctChoices.length > 0) {
      expectedAnswer = correctChoices.map(c => c.content).join(", ");
    } else {
      expectedAnswer = null;
    }
  }

  // Determine evaluation status based strictly on M04 data source of truth
  const isUnanswered = targetAnswer.question?.question_type === 'free_text'
    ? (!targetAnswer.free_text_answer || targetAnswer.free_text_answer.trim().length === 0)
    : (targetAnswer.choice === null || targetAnswer.choice === undefined);

  const evaluationStatus: 'incorrect' | 'unanswered' = isUnanswered ? 'unanswered' : 'incorrect';

  return {
    subjectName,
    exerciseTitle,
    questionContent,
    studentAnswer,
    expectedAnswer,
    evaluationStatus
  };
}

/**
 * Maps a purified RevisionCoachContext into M05 ProviderSourceDocuments.
 * This injects the M06 context into the existing M05 AI contract without breaking boundaries.
 */
export function mapRevisionContextToProviderSources(context: RevisionCoachContext): ProviderSourceDocument[] {
  const sources: ProviderSourceDocument[] = [];

  // 1. Official Context: Subject, Exercise and Question
  sources.push({
    sourceLabel: `Exercice: ${context.exerciseTitle} (${context.subjectName})`,
    content: `<question>\n${context.questionContent}\n</question>`,
    provenance: "OFFICIAL"
  });

  // 2. Student Content: Their exact answer (Only if they actually answered)
  if (context.evaluationStatus !== 'unanswered' && context.studentAnswer) {
    sources.push({
      sourceLabel: `Réponse de l'étudiant`,
      content: `<student_answer>\n${context.studentAnswer}\n</student_answer>`,
      provenance: "STUDENT"
    });
  }
  // If unanswered, we DO NOT invent a SYSTEM source. The absence of STUDENT source is enough.

  // 3. Expected Answer (if reliable)
  if (context.expectedAnswer) {
    sources.push({
      sourceLabel: `Correction officielle`,
      content: `<expected_answer>\n${context.expectedAnswer}\n</expected_answer>`,
      provenance: "OFFICIAL"
    });
  }

  return sources;
}
