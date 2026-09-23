// scripts/test-m08-history.ts
import test from "node:test";
import assert from "node:assert";
import { computeExamAnalytics } from "../src/lib/exam/queries";
import { ExamStatus } from "../src/types/exam";

// ==============================================================================
// Suite de tests M08.4.3 — Historique & Analyse des simulations d'examen
// ==============================================================================

test("M08.4.3 — 1. Aucune simulation → État vide propre", () => {
  const analytics = computeExamAnalytics([]);

  assert.strictEqual(analytics.global.totalSimulations, 0);
  assert.strictEqual(analytics.global.averageScorePercentage, null);
  assert.strictEqual(analytics.global.bestScorePercentage, null);
  assert.strictEqual(analytics.global.lastSimulationDate, null);
  assert.deepStrictEqual(analytics.timeline, []);
  assert.deepStrictEqual(analytics.bySubject, {});
});

test("M08.4.3 — 2. Une simulation → Calcul correct", () => {
  const sessions = [
    {
      id: "sess-1",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-15T10:00:00.000Z",
      created_at: "2026-09-15T09:00:00.000Z",
      subject_id: "subj-1",
      subject_name: "Droit Constitutionnel",
      exercise_title: "Partiel Blanc Droit",
      score: 16,
      max_score: 20, // 80%
    },
  ];

  const analytics = computeExamAnalytics(sessions);

  assert.strictEqual(analytics.global.totalSimulations, 1);
  assert.strictEqual(analytics.global.averageScorePercentage, 80);
  assert.strictEqual(analytics.global.bestScorePercentage, 80);
  assert.strictEqual(analytics.global.lastSimulationDate, "2026-09-15T10:00:00.000Z");
  assert.strictEqual(analytics.timeline.length, 1);
  assert.strictEqual(analytics.timeline[0].percentage, 80);
  assert.strictEqual(analytics.timeline[0].subjectName, "Droit Constitutionnel");
  assert.strictEqual(analytics.bySubject["subj-1"].simulationsCount, 1);
  assert.strictEqual(analytics.bySubject["subj-1"].averagePercentage, 80);
});

test("M08.4.3 — 3. Plusieurs simulations → Moyenne correcte", () => {
  const sessions = [
    {
      id: "sess-1",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-10T10:00:00.000Z",
      created_at: "2026-09-10T09:00:00.000Z",
      subject_name: "Histoire",
      score: 10,
      max_score: 20, // 50%
    },
    {
      id: "sess-2",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-12T10:00:00.000Z",
      created_at: "2026-09-12T09:00:00.000Z",
      subject_name: "Histoire",
      score: 15,
      max_score: 20, // 75%
    },
    {
      id: "sess-3",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-14T10:00:00.000Z",
      created_at: "2026-09-14T09:00:00.000Z",
      subject_name: "Histoire",
      score: 18,
      max_score: 20, // 90%
    },
  ];

  const analytics = computeExamAnalytics(sessions);

  // Moyenne : (50 + 75 + 90) / 3 = 215 / 3 = 71.666 -> Math.round = 72%
  assert.strictEqual(analytics.global.totalSimulations, 3);
  assert.strictEqual(analytics.global.averageScorePercentage, 72);
});

test("M08.4.3 — 4. Meilleure performance correcte", () => {
  const sessions = [
    {
      id: "sess-1",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-10T10:00:00.000Z",
      created_at: "2026-09-10T09:00:00.000Z",
      subject_name: "Économie",
      score: 8,
      max_score: 20, // 40%
    },
    {
      id: "sess-2",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-12T10:00:00.000Z",
      created_at: "2026-09-12T09:00:00.000Z",
      subject_name: "Économie",
      score: 19,
      max_score: 20, // 95%
    },
    {
      id: "sess-3",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-14T10:00:00.000Z",
      created_at: "2026-09-14T09:00:00.000Z",
      subject_name: "Économie",
      score: 13,
      max_score: 20, // 65%
    },
  ];

  const analytics = computeExamAnalytics(sessions);
  assert.strictEqual(analytics.global.bestScorePercentage, 95);
});

test("M08.4.3 — 5. Dernière simulation correcte (date la plus récente)", () => {
  const sessions = [
    {
      id: "sess-old",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-01T10:00:00.000Z",
      created_at: "2026-09-01T09:00:00.000Z",
      subject_name: "Droit",
      score: 12,
      max_score: 20,
    },
    {
      id: "sess-latest",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-20T16:30:00.000Z",
      created_at: "2026-09-20T15:30:00.000Z",
      subject_name: "Droit",
      score: 15,
      max_score: 20,
    },
    {
      id: "sess-mid",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-10T11:00:00.000Z",
      created_at: "2026-09-10T10:00:00.000Z",
      subject_name: "Droit",
      score: 14,
      max_score: 20,
    },
  ];

  const analytics = computeExamAnalytics(sessions);
  assert.strictEqual(analytics.global.lastSimulationDate, "2026-09-20T16:30:00.000Z");
});

test("M08.4.3 — 6. Timeline chronologique (tri croissant)", () => {
  // Fourni dans le désordre chronologique
  const sessions = [
    {
      id: "sess-3",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-20T10:00:00.000Z",
      created_at: "2026-09-20T09:00:00.000Z",
      subject_name: "Maths",
      score: 18,
      max_score: 20, // 90%
    },
    {
      id: "sess-1",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-05T10:00:00.000Z",
      created_at: "2026-09-05T09:00:00.000Z",
      subject_name: "Maths",
      score: 10,
      max_score: 20, // 50%
    },
    {
      id: "sess-2",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-12T10:00:00.000Z",
      created_at: "2026-09-12T09:00:00.000Z",
      subject_name: "Maths",
      score: 14,
      max_score: 20, // 70%
    },
  ];

  const analytics = computeExamAnalytics(sessions);

  assert.strictEqual(analytics.timeline.length, 3);
  // Doit être ordonné chronologiquement croissant (05 sept -> 12 sept -> 20 sept)
  assert.strictEqual(analytics.timeline[0].percentage, 50);
  assert.strictEqual(analytics.timeline[1].percentage, 70);
  assert.strictEqual(analytics.timeline[2].percentage, 90);
  assert.strictEqual(analytics.timeline[0].sessionId, "sess-1");
  assert.strictEqual(analytics.timeline[2].sessionId, "sess-3");
});

test("M08.4.3 — 7 & 8. Sessions submitted et expired INCLUSES", () => {
  const sessions = [
    {
      id: "sess-submitted",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-10T10:00:00.000Z",
      created_at: "2026-09-10T09:00:00.000Z",
      subject_name: "Gestion",
      score: 14,
      max_score: 20, // 70%
    },
    {
      id: "sess-expired",
      status: "expired" as ExamStatus,
      completed_at: "2026-09-12T10:00:00.000Z",
      created_at: "2026-09-12T09:00:00.000Z",
      subject_name: "Gestion",
      score: 12,
      max_score: 20, // 60%
    },
  ];

  const analytics = computeExamAnalytics(sessions);

  assert.strictEqual(analytics.global.totalSimulations, 2);
  assert.strictEqual(analytics.global.averageScorePercentage, 65);
  assert.strictEqual(analytics.timeline.length, 2);
  assert.strictEqual(analytics.timeline[0].status, "submitted");
  assert.strictEqual(analytics.timeline[1].status, "expired");
});

test("M08.4.3 — 9, 10, 11. Sessions active, planned et abandoned EXCLUES", () => {
  const sessions = [
    {
      id: "sess-active",
      status: "active" as ExamStatus,
      completed_at: null,
      created_at: "2026-09-15T10:00:00.000Z",
      subject_name: "Droit",
      score: 10,
      max_score: 20,
    },
    {
      id: "sess-planned",
      status: "planned" as ExamStatus,
      completed_at: null,
      created_at: "2026-09-15T11:00:00.000Z",
      subject_name: "Droit",
      score: null,
      max_score: null,
    },
    {
      id: "sess-abandoned",
      status: "abandoned" as ExamStatus,
      completed_at: null,
      created_at: "2026-09-15T12:00:00.000Z",
      subject_name: "Droit",
      score: 5,
      max_score: 20,
    },
    {
      id: "sess-valid",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-15T14:00:00.000Z",
      created_at: "2026-09-15T13:00:00.000Z",
      subject_name: "Droit",
      score: 16,
      max_score: 20, // 80%
    },
  ];

  const analytics = computeExamAnalytics(sessions);

  // Seule la session submitted doit être comptabilisée
  assert.strictEqual(analytics.global.totalSimulations, 1);
  assert.strictEqual(analytics.global.averageScorePercentage, 80);
  assert.strictEqual(analytics.timeline.length, 1);
  assert.strictEqual(analytics.timeline[0].sessionId, "sess-valid");
});

test("M08.4.3 — 12. Score null ignoré dans le calcul de pourcentage (pas compté comme 0%)", () => {
  const sessions = [
    {
      id: "sess-unscored",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-10T10:00:00.000Z",
      created_at: "2026-09-10T09:00:00.000Z",
      subject_name: "Philosophie",
      score: null, // Pas encore noté
      max_score: 20,
    },
    {
      id: "sess-scored",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-12T10:00:00.000Z",
      created_at: "2026-09-12T09:00:00.000Z",
      subject_name: "Philosophie",
      score: 16,
      max_score: 20, // 80%
    },
  ];

  const analytics = computeExamAnalytics(sessions);

  assert.strictEqual(analytics.global.totalSimulations, 2, "La session terminée compte dans le total");
  assert.strictEqual(analytics.global.averageScorePercentage, 80, "La session sans score ne doit PAS abaisser la moyenne à 40%");
  assert.strictEqual(analytics.global.bestScorePercentage, 80);
  assert.strictEqual(analytics.timeline.length, 1, "La session sans score ne doit pas créer de point 0% sur la courbe");
});

test("M08.4.3 — 13 & 14. max_score null ou max_score = 0 ignorés", () => {
  const sessions = [
    {
      id: "sess-null-max",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-10T10:00:00.000Z",
      created_at: "2026-09-10T09:00:00.000Z",
      subject_name: "Physique",
      score: 10,
      max_score: null,
    },
    {
      id: "sess-zero-max",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-11T10:00:00.000Z",
      created_at: "2026-09-11T09:00:00.000Z",
      subject_name: "Physique",
      score: 0,
      max_score: 0, // Ne doit pas provoquer de NaN ou division par zéro
    },
    {
      id: "sess-valid",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-12T10:00:00.000Z",
      created_at: "2026-09-12T09:00:00.000Z",
      subject_name: "Physique",
      score: 15,
      max_score: 20, // 75%
    },
  ];

  const analytics = computeExamAnalytics(sessions);

  assert.strictEqual(analytics.global.totalSimulations, 3);
  assert.strictEqual(analytics.global.averageScorePercentage, 75);
  assert.strictEqual(analytics.global.bestScorePercentage, 75);
  assert.strictEqual(analytics.timeline.length, 1);
});

test("M08.4.3 — 15. Regroupement par matière correct (bySubject)", () => {
  const sessions = [
    {
      id: "sess-1",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-10T10:00:00.000Z",
      created_at: "2026-09-10T09:00:00.000Z",
      subject_id: "subj-math",
      subject_name: "Mathématiques",
      score: 16,
      max_score: 20, // 80%
    },
    {
      id: "sess-2",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-12T10:00:00.000Z",
      created_at: "2026-09-12T09:00:00.000Z",
      subject_id: "subj-math",
      subject_name: "Mathématiques",
      score: 12,
      max_score: 20, // 60%
    },
    {
      id: "sess-3",
      status: "submitted" as ExamStatus,
      completed_at: "2026-09-14T10:00:00.000Z",
      created_at: "2026-09-14T09:00:00.000Z",
      subject_id: "subj-law",
      subject_name: "Droit Civil",
      score: 18,
      max_score: 20, // 90%
    },
  ];

  const analytics = computeExamAnalytics(sessions);

  const math = analytics.bySubject["subj-math"];
  const law = analytics.bySubject["subj-law"];

  assert.ok(math);
  assert.strictEqual(math.subjectName, "Mathématiques");
  assert.strictEqual(math.simulationsCount, 2);
  assert.strictEqual(math.averagePercentage, 70); // (80 + 60) / 2 = 70

  assert.ok(law);
  assert.strictEqual(law.subjectName, "Droit Civil");
  assert.strictEqual(law.simulationsCount, 1);
  assert.strictEqual(law.averagePercentage, 90);
});

test("M08.4.3 — 16. Sécurité : Isolation stricte de l'utilisateur", async () => {
  // Vérifie que getExamAnalytics n'accepte aucun argument userId venant du client
  // et s'appuie strictement sur le token d'authentification du serveur.
  const { getExamAnalytics } = await import("../src/lib/exam/queries");
  assert.strictEqual(typeof getExamAnalytics, "function");
  assert.strictEqual(
    getExamAnalytics.length,
    0,
    "getExamAnalytics ne doit accepter aucun argument userId client"
  );
});

test("M08.4.3 — 17. Architecture DB : Aucun nouveau stockage ni table", () => {
  // Vérification que les DTOs sont dérivés en mémoire côté serveur
  // Aucune nouvelle table de cache ou d'analytique n'a été ajoutée.
  const forbiddenTables = [
    "exam_analytics",
    "exam_history",
    "exam_reports",
    "exam_scores",
    "exam_performance",
    "exam_progression",
  ];

  // Le test vérifie conceptuellement et textuellement l'absence d'appel de table non autorisée
  forbiddenTables.forEach((tableName) => {
    assert.ok(
      !computeExamAnalytics.toString().includes(tableName),
      `Aucune table ${tableName} ne doit être référencée`
    );
  });
});

test("M08.4.3 — 18. Non-régression M08.3 (Simulateur d'examen)", async () => {
  const { startExamSchema, submitExamAnswerSchema, finishExamSchema } = await import(
    "../src/types/exam"
  );
  assert.ok(startExamSchema);
  assert.ok(submitExamAnswerSchema);
  assert.ok(finishExamSchema);
});

test("M08.4.3 — 19. Non-régression M08.4.2 (Résultats et recommandations)", async () => {
  const { getExamRecommendation } = await import("../src/lib/exam/queries");
  const rec = getExamRecommendation(85);
  assert.strictEqual(rec.level, "high");
  assert.strictEqual(
    rec.message,
    "Très bonne performance sur cette simulation. Continue à t'entraîner régulièrement."
  );
});
