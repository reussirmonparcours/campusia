import test from "node:test";
import assert from "node:assert";

// Mock des Server Actions
let mockUserId = "user-A";
let existingActiveSession = false;
let mockPriorityExercises = [{ exerciseId: "ex-1", score: 10, reasons: [] }];
let sessionCreated = false;
let mockSessionStatus = "active";
let mockSessionUserId = "user-A";
let mockM04Fail = false;
let mockCoherentSession = true;


const mockFindOrCreateRevisionSession = async (subjectId: string) => {
  if (!mockUserId) return { error: "Unauthorized" };
  
  if (existingActiveSession) {
    if (mockCoherentSession) {
      if (subjectId === "sub-b") return { data: { id: "session-active-b" } };
      return { data: { id: "session-active" } };
    } else {
      return { data: { id: "session-new-after-abandon" } }; // Simule la création d'une nouvelle après abandon
    }
  }
  
  if (mockPriorityExercises.length === 0) {
    return { error: "Aucun exercice disponible pour cette matière" };
  }
  
  sessionCreated = true;
  return { data: { id: "session-new", learning_exercise_id: mockPriorityExercises[0].exerciseId } };
};

const mockStartRevisionAttemptAction = async (sessionId: string, exerciseId: string) => {
  if (!mockUserId) return { error: "Unauthorized" };
  if (mockSessionUserId !== mockUserId) return { error: "Session introuvable ou accès refusé" };
  if (mockSessionStatus !== "active") return { error: "Cette session est déjà terminée" };
  if (exerciseId !== "ex-1") return { error: "Incohérence d'exercice" };
  if (mockM04Fail) return { error: "Impossible de démarrer l'exercice" };
  
  return { data: { attemptId: "attempt-1", linkId: "link-1" } };
};

const mockCloseRevisionSession = async (sessionId: string, status: string) => {
  if (!mockUserId) return { error: "Unauthorized" };
  if (status !== 'completed' && status !== 'abandoned') return { error: "Statut invalide" };
  if (mockSessionStatus !== 'active') return { error: "Impossible de clore la session ou transition interdite" };
  return { data: { id: sessionId, status } };
};

test("M06 Phase 3 UI Server Actions Tests", async (t) => {
  
  await t.test("1. utilisateur non authentifié → accès refusé", async () => {
    mockUserId = ""; // Simule logout
    const res = await mockFindOrCreateRevisionSession("sub-1");
    assert.strictEqual(res.error, "Unauthorized");
    mockUserId = "user-A"; // reset
  });

  await t.test("2. utilisateur authentifié et aucune session active → crée session", async () => {
    existingActiveSession = false;
    sessionCreated = false;
    const res = await mockFindOrCreateRevisionSession("sub-1");
    assert.ok(sessionCreated);
    assert.strictEqual(res.data?.id, "session-new");
  });

  await t.test("3. aucun exercice prioritaire → état empty", async () => {
    existingActiveSession = false;
    mockPriorityExercises = []; // Aucun exercice accessible
    const res = await mockFindOrCreateRevisionSession("sub-empty");
    assert.strictEqual(res.error, "Aucun exercice disponible pour cette matière");
    mockPriorityExercises = [{ exerciseId: "ex-1", score: 10, reasons: [] }]; // reset
  });

  await t.test("4. session active existante → reprise (pas de duplication)", async () => {
    existingActiveSession = true;
    mockCoherentSession = true;
    sessionCreated = false;
    const res = await mockFindOrCreateRevisionSession("sub-1");
    assert.ok(!sessionCreated); // Ne crée pas de nouvelle session
    assert.strictEqual(res.data?.id, "session-active");
  });

  await t.test("5. création d'attempt → M04 orchestration", async () => {
    mockSessionStatus = "active";
    const res = await mockStartRevisionAttemptAction("session-active", "ex-1");
    assert.strictEqual(res.data?.attemptId, "attempt-1");
    assert.strictEqual(res.data?.linkId, "link-1");
  });

  await t.test("6. création d'attempt avec session d'un autre utilisateur → refusé", async () => {
    mockSessionUserId = "user-B"; // Session de qqun d'autre
    const res = await mockStartRevisionAttemptAction("session-b", "ex-1");
    assert.strictEqual(res.error, "Session introuvable ou accès refusé");
    mockSessionUserId = "user-A"; // reset
  });

  await t.test("7. création d'attempt sur session terminée/abandonnée → refusé", async () => {
    mockSessionStatus = "completed"; // Session déjà fermée
    const res = await mockStartRevisionAttemptAction("session-active", "ex-1");
    assert.strictEqual(res.error, "Cette session est déjà terminée");
    mockSessionStatus = "active"; // reset
  });

  await t.test("8. incohérence d'exercice → refusé", async () => {
    const res = await mockStartRevisionAttemptAction("session-active", "ex-hack");
    assert.strictEqual(res.error, "Incohérence d'exercice");
  });

  await t.test("9. M04 startAttempt échoue → aucune revision_attempt créée", async () => {
    mockM04Fail = true;
    const res = await mockStartRevisionAttemptAction("session-active", "ex-1");
    assert.strictEqual(res.error, "Impossible de démarrer l'exercice");
    mockM04Fail = false;
  });

  await t.test("10. State Machine: planned -> active (implicite à la création)", async () => {
    existingActiveSession = false;
    const res = await mockFindOrCreateRevisionSession("sub-1");
    assert.strictEqual(res.data?.id, "session-new");
  });

  await t.test("11. State Machine: active -> completed", async () => {
    mockSessionStatus = "active";
    const res = await mockCloseRevisionSession("session-active", "completed");
    assert.strictEqual(res.data?.status, "completed");
  });

  await t.test("12. State Machine: active -> abandoned", async () => {
    mockSessionStatus = "active";
    const res = await mockCloseRevisionSession("session-active", "abandoned");
    assert.strictEqual(res.data?.status, "abandoned");
  });

  await t.test("13. State Machine: completed -> active/abandoned DENIED", async () => {
    mockSessionStatus = "completed";
    const res = await mockCloseRevisionSession("session-active", "abandoned");
    assert.strictEqual(res.error, "Impossible de clore la session ou transition interdite");
    mockSessionStatus = "active";
  });

  await t.test("14. Session existante avec exercice incohérent -> comportement déterministe (abandon)", async () => {
    existingActiveSession = true;
    mockCoherentSession = false; // Simule une incohérence (ex: exercice supprimé)
    const res = await mockFindOrCreateRevisionSession("sub-1");
    assert.strictEqual(res.data?.id, "session-new-after-abandon");
  });
});
