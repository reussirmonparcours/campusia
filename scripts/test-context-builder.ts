import test from "node:test";
import assert from "node:assert";
import { buildAIContext } from "@/lib/ai/context";
import { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// MOCK BUILDER
// ============================================================================

type MockQueryState = {
  table: string;
  _select: string;
  _eq: Record<string, unknown>;
  _order: Record<string, unknown>;
  _limit: number | null;
};

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const defaultAuth = {
    getUser: async () => ({ data: { user: { id: "user-123" } }, error: null }),
  };

  const defaultFrom = (table: string) => {
    const queryState: MockQueryState = {
      table,
      _select: "",
      _eq: {},
      _order: {},
      _limit: null,
    };

    const chain = {
      select: (sel: string) => { queryState._select = sel; return chain; },
      eq: (col: string, val: unknown) => { queryState._eq[col] = val; return chain; },
      order: (col: string, opts: unknown) => { queryState._order[col] = opts; return chain; },
      limit: (l: number) => { queryState._limit = l; return chain; },
      single: async () => {
        return executeMock(queryState, true);
      },
      then: (resolve: (val: unknown) => void) => {
        executeMock(queryState, false).then(resolve);
      }
    };

    return chain;
  };

  async function executeMock(query: MockQueryState, single: boolean) {
    if (overrides.from) {
      const fromOverrides = overrides.from as Record<string, (q: MockQueryState, s: boolean) => unknown>;
      if (fromOverrides[query.table]) {
        return fromOverrides[query.table](query, single);
      }
    }
    return { data: single ? null : [], error: null };
  }

  return {
    auth: overrides.auth || defaultAuth,
    from: defaultFrom,
  };
}

// ============================================================================
// TESTS
// ============================================================================

test("ContextBuilder Test Suite", async (t) => {

  await t.test("1. Unauthorized user throws error", async () => {
    const mockClient = createMockSupabase({
      auth: { getUser: async () => ({ data: { user: null }, error: new Error("Auth failed") }) }
    });
    await assert.rejects(
      async () => await buildAIContext(undefined, mockClient as unknown as SupabaseClient),
      /Unauthorized/
    );
  });

  await t.test("2. Context sans PII (Student Context)", async () => {
    const mockClient = createMockSupabase({
      from: {
        student_profiles: () => ({
          data: {
            custom_program: "Master AI",
            custom_level: "M2",
            programs: { name: "Computer Science", cycle: "Master" },
            tracks: { name: "Data Science" },
            semesters: { semester_number: 3 }
          },
          error: null
        })
      }
    });

    const ctx = await buildAIContext(undefined, mockClient as unknown as SupabaseClient);
    
    assert.strictEqual(ctx.studentContext.semester, "Semestre 3");
    assert.strictEqual(ctx.studentContext.program, "Computer Science - Data Science");
    assert.strictEqual(ctx.studentContext.level, "Master");
    // Verify no PII fields exist
    assert.strictEqual((ctx.studentContext as Record<string, unknown>).first_name, undefined);
    assert.strictEqual((ctx.studentContext as Record<string, unknown>).email, undefined);
  });

  await t.test("3. Contexte académique officiel (created_by IS NULL)", async () => {
    const mockClient = createMockSupabase({
      from: {
        subjects: () => ({
          data: { id: "sub-1", name: "Math", description: "Algebra", created_by: null },
          error: null
        })
      }
    });
    const ctx = await buildAIContext("sub-1", mockClient as unknown as SupabaseClient);
    assert.strictEqual(ctx.academicContext?.subjectName, "Math");
  });

  await t.test("4. Contexte matière privée utilisateur", async () => {
    const mockClient = createMockSupabase({
      from: {
        subjects: () => ({ data: { id: "sub-2", name: "My Math", description: "Custom", created_by: "user-123" }, error: null })
      }
    });
    const ctx = await buildAIContext("sub-2", mockClient as unknown as SupabaseClient);
    assert.strictEqual(ctx.academicContext?.subjectName, "My Math");
  });

  await t.test("5. Accès refusé à une matière privée d'un autre utilisateur", async () => {
    const mockClient = createMockSupabase({
      from: {
        subjects: () => ({ data: { id: "sub-3", name: "Secret", description: "No Access", created_by: "other-user" }, error: null })
      }
    });
    await assert.rejects(
      async () => await buildAIContext("sub-3", mockClient as unknown as SupabaseClient),
      /Accès interdit/
    );
  });

  await t.test("6. Max 5 activités (M03) limit and prioritization with > 15 activities", async () => {
    // Generate 15 recent global activities + 5 older subject-specific activities
    const globalActivities = Array.from({ length: 15 }).map((_, i) => ({
      id: `g${i}`, activity_type: "quiz", description: `global ${i}`, subject_id: "other", created_at: `2026-09-${10 + i}T10:00:00Z`
    }));
    const subjectActivities = Array.from({ length: 5 }).map((_, i) => ({
      id: `s${i}`, activity_type: "quiz", description: `subject ${i}`, subject_id: "sub-1", created_at: `2026-08-${10 + i}T10:00:00Z` // Older!
    }));

    const mockClient = createMockSupabase({
      from: {
        student_activities: (q: MockQueryState) => {
          if (q._eq["subject_id"] === "sub-1") {
            // Mocking the subject-specific query
            return { data: subjectActivities.reverse().slice(0, 5), error: null };
          }
          // Mocking the global query
          return { data: globalActivities.reverse().slice(0, 5), error: null };
        },
        subjects: () => ({ data: { id: "sub-1", name: "Math", created_by: null }, error: null })
      }
    });
    const ctx = await buildAIContext("sub-1", mockClient as unknown as SupabaseClient);
    assert.strictEqual(ctx.learningContext.recentActivities.length, 5);
    
    // Because we prioritize by subject, all 5 should be the subject ones even if they are older
    for (let i = 0; i < 5; i++) {
      assert.ok(ctx.learningContext.recentActivities[i].includes("subject"));
    }
  });

  await t.test("7. Max 5 éléments M04 and prioritization (Subject + Pedagogical + Recency)", async () => {
    const attempts = [
      // other subject
      { id: "1", status: "completed", score: 20, max_score: 20, started_at: "2026-09-10T00:00:00Z", learning_exercises: { subject_id: "other", title: "ex1" } },
      
      // subject matches
      { id: "2", status: "completed", score: 20, max_score: 20, started_at: "2026-09-12T00:00:00Z", learning_exercises: { subject_id: "sub-1", title: "Success Newer" } },
      { id: "3", status: "abandoned", score: null, max_score: null, started_at: "2026-09-11T00:00:00Z", learning_exercises: { subject_id: "sub-1", title: "Abandoned Older" } },
      { id: "4", status: "completed", score: 5, max_score: 20, started_at: "2026-09-13T00:00:00Z", learning_exercises: { subject_id: "sub-1", title: "Error Newest" } },
      { id: "5", status: "completed", score: 19, max_score: 20, started_at: "2026-09-10T00:00:00Z", learning_exercises: { subject_id: "sub-1", title: "Error Oldest" } },
      { id: "6", status: "completed", score: 20, max_score: 20, started_at: "2026-09-11T00:00:00Z", learning_exercises: { subject_id: "sub-1", title: "Success Older" } },
      { id: "7", status: "abandoned", score: null, max_score: null, started_at: "2026-09-12T00:00:00Z", learning_exercises: { subject_id: "sub-1", title: "Abandoned Newer" } },
    ];

    const mockClient = createMockSupabase({
      from: {
        learning_attempts: (q: MockQueryState) => {
          // If filtering by subject, return those. Otherwise global.
          let filtered = attempts;
          if (q._eq["learning_exercises.subject_id"] === "sub-1") {
            filtered = attempts.filter(a => a.learning_exercises.subject_id === "sub-1");
          }
          // Sort desc by started_at and slice to 5
          filtered = filtered.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()).slice(0, 5);
          return { data: filtered, error: null };
        },
        subjects: () => ({ data: { id: "sub-1", name: "Math", created_by: null }, error: null })
      }
    });

    const ctx = await buildAIContext("sub-1", mockClient as unknown as SupabaseClient);
    assert.strictEqual(ctx.learningContext.recentErrors.length, 5);
    
    // Expectation order based on M04 rules:
    // Subject Match (all are sub-1 because of the filter/sort)
    // Pedagogical (abandoned, error > success)
    // Recency (newer > older)
    // Expected:
    // 1. Error Newest (ped=1, 13th)
    // 2. Abandoned Newer (ped=1, 12th)
    // 3. Abandoned Older (ped=1, 11th)
    // 4. Success Newer (ped=0, 12th)
    // 5. Success Older (ped=0, 11th)
    
    assert.ok(ctx.learningContext.recentErrors[0].includes("Error Newest"));
    assert.ok(ctx.learningContext.recentErrors[1].includes("Abandoned Newer"));
    assert.ok(ctx.learningContext.recentErrors[2].includes("Abandoned Older"));
    assert.ok(ctx.learningContext.recentErrors[3].includes("Success Newer"));
    assert.ok(ctx.learningContext.recentErrors[4].includes("Success Older"));
  });

  await t.test("8. Absence de subjectId (Global Context)", async () => {
    const mockClient = createMockSupabase({});
    const ctx = await buildAIContext(undefined, mockClient as unknown as SupabaseClient);
    assert.strictEqual(ctx.academicContext, undefined); // No invented context
    assert.strictEqual(ctx.learningContext.recentActivities.length, 0); // No errors gracefully handled
    assert.strictEqual(ctx.learningContext.recentErrors.length, 0);
  });
  
  await t.test("9. Condensation textuelle (trop grand)", async () => {
    const mockClient = createMockSupabase({
      from: {
        student_activities: () => ({
          data: [{ activity_type: "note", description: "a".repeat(500), subject_id: "s", created_at: "2" }]
        })
      }
    });
    const ctx = await buildAIContext(undefined, mockClient as unknown as SupabaseClient);
    assert.ok(ctx.learningContext.recentActivities[0].length < 150); // Trimmed!
  });

  console.log("All context builder tests passed successfully!");
});
