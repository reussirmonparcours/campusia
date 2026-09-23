import test from "node:test";
import assert from "node:assert";
import { calculateRevisionPriority } from "../src/lib/revision/priority";

test("M06 Phase 2 Priority Engine Tests", async (t) => {
  const nowDate = new Date("2026-09-19T12:00:00Z");
  
  // Helpers
  const makeAttempt = (id: string, exId: string, score: number | null, maxScore: number | null, status: string, daysAgo: number) => ({
    id,
    exercise_id: exId,
    score,
    max_score: maxScore,
    status,
    created_at: new Date(nowDate.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    user_id: "user-A"
  });

  await t.test("1. exercice avec réussite parfaite (score 0)", () => {
    const ex = [{ id: "ex-perfect" }];
    const attempts = [makeAttempt("a1", "ex-perfect", 10, 10, "completed", 1)];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 0);
    assert.strictEqual(res[0].reasons.length, 0);
  });

  await t.test("2. exercice jamais tenté (+2)", () => {
    const ex = [{ id: "ex-never" }];
    const res = calculateRevisionPriority(ex, [], nowDate);
    assert.strictEqual(res[0].score, 2);
    assert.strictEqual(res[0].reasons[0].type, 'never_reviewed');
    assert.strictEqual(res[0].relevantEventCreatedAt, null);
  });

  await t.test("3. erreur ancienne (+10)", () => {
    const ex = [{ id: "ex-old-error" }];
    const attempts = [makeAttempt("a1", "ex-old-error", 5, 10, "completed", 10)];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 10);
    assert.strictEqual(res[0].reasons[0].type, 'old_error');
  });

  await t.test("4. erreur récente (+15)", () => {
    const ex = [{ id: "ex-recent-error" }];
    const attempts = [makeAttempt("a1", "ex-recent-error", 5, 10, "completed", 1)];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 15);
    assert.strictEqual(res[0].reasons[0].type, 'recent_error');
  });

  await t.test("5. abandon ancien (+5)", () => {
    const ex = [{ id: "ex-old-abandon" }];
    const attempts = [makeAttempt("a1", "ex-old-abandon", null, null, "abandoned", 10)];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 5);
  });

  await t.test("6. abandon récent (+7.5)", () => {
    const ex = [{ id: "ex-recent-abandon" }];
    const attempts = [makeAttempt("a1", "ex-recent-abandon", null, null, "abandoned", 1)];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 7.5);
  });

  await t.test("7. accumulation événementielle (plusieurs erreurs)", () => {
    const ex = [{ id: "ex-multi" }];
    const attempts = [
      makeAttempt("a1", "ex-multi", 0, 10, "completed", 10), // +10
      makeAttempt("a2", "ex-multi", 5, 10, "completed", 20), // +10
    ];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 20);
  });

  await t.test("8. erreur + abandon (accumulation)", () => {
    const ex = [{ id: "ex-mixed" }];
    const attempts = [
      makeAttempt("a1", "ex-mixed", 0, 10, "completed", 10), // +10
      makeAttempt("a2", "ex-mixed", null, null, "abandoned", 20), // +5
    ];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 15);
  });

  await t.test("9. multiplicateurs séparés (récent + ancien)", () => {
    const ex = [{ id: "ex-sep" }];
    const attempts = [
      makeAttempt("a1", "ex-sep", 0, 10, "completed", 1), // +15
      makeAttempt("a2", "ex-sep", 5, 10, "completed", 10), // +10
    ];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 25);
  });

  await t.test("10. tie-break timestamp", () => {
    const ex = [{ id: "ex1" }, { id: "ex2" }];
    // Both have 1 old error (score 10). ex2's error is more recent.
    const attempts = [
      makeAttempt("a1", "ex1", 0, 10, "completed", 15), 
      makeAttempt("a2", "ex2", 0, 10, "completed", 10), 
    ];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].exerciseId, "ex2");
    assert.strictEqual(res[1].exerciseId, "ex1");
  });

  await t.test("11. tie-break exercise_id", () => {
    const ex = [{ id: "ex-b" }, { id: "ex-a" }];
    // Both never reviewed (score 2, timestamp null)
    const res = calculateRevisionPriority(ex, [], nowDate);
    assert.strictEqual(res[0].exerciseId, "ex-a");
    assert.strictEqual(res[1].exerciseId, "ex-b");
  });

  await t.test("12. aucun exercice", () => {
    const res = calculateRevisionPriority([], [], nowDate);
    assert.strictEqual(res.length, 0);
  });

  await t.test("13. aucun historique (matière)", () => {
    const ex = [{ id: "ex1" }, { id: "ex2" }];
    const res = calculateRevisionPriority(ex, [], nowDate);
    assert.strictEqual(res.length, 2);
    assert.strictEqual(res[0].score, 2);
    assert.strictEqual(res[1].score, 2);
  });

  await t.test("14. erreur + abandon sur le MÊME événement (récent)", () => {
    const ex = [{ id: "ex-same-event" }];
    // score < max_score (0 < 10) AND status = abandoned.
    // Error: +10, Abandon: +5 => +15. Recent => 15 * 1.5 = 22.5.
    const attempts = [makeAttempt("a1", "ex-same-event", 0, 10, "abandoned", 1)];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 22.5);
  });

  await t.test("15. donnée incohérente: score > max_score n'est pas une erreur", () => {
    const ex = [{ id: "ex-incoherent" }];
    const attempts = [makeAttempt("a1", "ex-incoherent", 15, 10, "completed", 1)];
    const res = calculateRevisionPriority(ex, attempts, nowDate);
    assert.strictEqual(res[0].score, 0); // Not counted as error
  });
});
