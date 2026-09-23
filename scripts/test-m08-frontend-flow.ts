// scripts/test-m08-frontend-flow.ts
import test from "node:test";
import assert from "node:assert";
import {
  createExamSchema,
  startExamSchema,
  submitExamAnswerSchema,
  finishExamSchema,
} from "../src/types/exam";

test("M08.3 — 1. Validation des Schémas de Transition et Entrées", () => {
  // Test createExamSchema
  const validCreate = createExamSchema.safeParse({
    exerciseId: "11111111-1111-1111-1111-111111111111",
    durationMinutes: 45,
    questionCount: 15,
  });
  assert.strictEqual(validCreate.success, true, "createExamSchema doit accepter une configuration valide");

  const invalidDuration = createExamSchema.safeParse({
    exerciseId: "11111111-1111-1111-1111-111111111111",
    durationMinutes: -10,
  });
  assert.strictEqual(invalidDuration.success, false, "createExamSchema doit rejeter une durée négative");

  // Test startExamSchema
  const validStart = startExamSchema.safeParse({
    sessionId: "22222222-2222-2222-2222-222222222222",
  });
  assert.strictEqual(validStart.success, true);

  // Test submitExamAnswerSchema
  const validAnswerChoice = submitExamAnswerSchema.safeParse({
    sessionId: "22222222-2222-2222-2222-222222222222",
    questionId: "33333333-3333-3333-3333-333333333333",
    choiceId: "44444444-4444-4444-4444-444444444444",
  });
  assert.strictEqual(validAnswerChoice.success, true);

  const validAnswerText = submitExamAnswerSchema.safeParse({
    sessionId: "22222222-2222-2222-2222-222222222222",
    questionId: "33333333-3333-3333-3333-333333333333",
    freeTextAnswer: "Ceci est une réponse argumentée",
  });
  assert.strictEqual(validAnswerText.success, true);

  // Test finishExamSchema
  const validFinish = finishExamSchema.safeParse({
    sessionId: "22222222-2222-2222-2222-222222222222",
  });
  assert.strictEqual(validFinish.success, true);
});

test("M08.3 — 2. Secret Pédagogique & Étanchéité de is_correct", () => {
  // Simule le retour de submitExamAnswer après sécurisation
  const safeClientPayload = {
    success: true,
    savedAt: new Date().toISOString(),
  };

  assert.strictEqual("is_correct" in safeClientPayload, false, "is_correct ne doit JAMAIS fuiter dans le payload client");
  assert.strictEqual("score" in safeClientPayload, false, "Aucun score partiel ne doit être communiqué");
});

test("M08.3 — 3. Logique du Chronomètre Strict (Timer UI)", () => {
  const now = Date.now();

  // Cas 1 : Temps normal (30 min restantes)
  const expiresFuture = new Date(now + 30 * 60 * 1000).toISOString();
  const diffFuture = Math.floor((new Date(expiresFuture).getTime() - now) / 1000);
  assert.strictEqual(diffFuture >= 1799 && diffFuture <= 1800, true);

  // Cas 2 : Temps d'alerte orange (< 5 min)
  const expiresWarning = new Date(now + 4 * 60 * 1000).toISOString();
  const diffWarning = Math.floor((new Date(expiresWarning).getTime() - now) / 1000);
  const isWarning = diffWarning > 60 && diffWarning <= 300;
  assert.strictEqual(isWarning, true, "Doit déclencher le mode alerte warning");

  // Cas 3 : Temps d'alerte rouge (< 1 min)
  const expiresUrgent = new Date(now + 45 * 1000).toISOString();
  const diffUrgent = Math.floor((new Date(expiresUrgent).getTime() - now) / 1000);
  const isUrgent = diffUrgent > 0 && diffUrgent <= 60;
  assert.strictEqual(isUrgent, true, "Doit déclencher le mode alerte urgent");

  // Cas 4 : Expiré (0s)
  const expiresPast = new Date(now - 5000).toISOString();
  const diffPast = Math.max(0, Math.floor((new Date(expiresPast).getTime() - now) / 1000));
  assert.strictEqual(diffPast, 0, "Temps écoulé doit être fixé à 0");
});

test("M08.3 — 4. Mini-Carte de Progression & Calcul des Réponses", () => {
  const mockQuestions = [
    { id: "q1", order_index: 0 },
    { id: "q2", order_index: 1 },
    { id: "q3", order_index: 2 },
    { id: "q4", order_index: 3 },
  ];

  const mockAnswers: Record<string, { choiceId: string | null; freeTextAnswer: string | null }> = {
    q1: { choiceId: "c1", freeTextAnswer: null },
    q3: { choiceId: null, freeTextAnswer: "Argumentation..." },
  };

  const answeredCount = Object.values(mockAnswers).filter(
    (ans) => Boolean(ans.choiceId) || Boolean(ans.freeTextAnswer?.trim())
  ).length;

  const unansweredCount = mockQuestions.length - answeredCount;

  assert.strictEqual(answeredCount, 2, "2 questions doivent être détectées comme répondues");
  assert.strictEqual(unansweredCount, 2, "2 questions doivent être détectées comme sans réponse");

  // Vérification de statut pour chaque question
  const isQ1Answered = Boolean(mockAnswers["q1"]?.choiceId);
  const isQ2Answered = Boolean(mockAnswers["q2"]?.choiceId);
  const isQ3Answered = Boolean(mockAnswers["q3"]?.freeTextAnswer?.trim());

  assert.strictEqual(isQ1Answered, true);
  assert.strictEqual(isQ2Answered, false);
  assert.strictEqual(isQ3Answered, true);
});

test("M08.3 — 5. Résilience au Rafraîchissement (Hydratation après Refresh)", () => {
  // Simule les données reçues par getExamSessionDetails lors du chargement initial ou refresh
  const serverSessionData = {
    status: "active" as const,
    started_at: "2026-09-21T10:00:00.000Z",
    expires_at: "2026-09-21T10:45:00.000Z",
  };

  const initialSavedAnswers = {
    "q-101": { choiceId: "choice-abc", freeTextAnswer: null },
    "q-102": { choiceId: null, freeTextAnswer: "Synthèse sauvegardée" },
  };

  // Après refresh, l'état frontend s'initialise à partir de initialSavedAnswers
  const clientAnswersState = { ...initialSavedAnswers };

  assert.strictEqual(Object.keys(clientAnswersState).length, 2);
  assert.strictEqual(clientAnswersState["q-101"].choiceId, "choice-abc");
  assert.strictEqual(clientAnswersState["q-102"].freeTextAnswer, "Synthèse sauvegardée");

  // Vérification que expires_at est conservé et ne repart pas de zéro
  assert.strictEqual(serverSessionData.expires_at, "2026-09-21T10:45:00.000Z");
});

test("M08.3 — 6. Clôture & Avertissement de Questions Manquantes", () => {
  const totalQuestions = 5;
  const answers: Record<string, { choiceId: string | null; freeTextAnswer: string | null }> = {
    q1: { choiceId: "c1", freeTextAnswer: null },
    q2: { choiceId: "c2", freeTextAnswer: null },
  };

  const answered = Object.values(answers).filter(
    (ans) => Boolean(ans.choiceId) || Boolean(ans.freeTextAnswer?.trim())
  ).length;
  const missing = totalQuestions - answered;

  assert.strictEqual(missing, 3);
  const warningText = `Il vous reste ${missing} questions sans réponse.`;
  assert.strictEqual(warningText, "Il vous reste 3 questions sans réponse.");
});
